import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
  }

  try {
    let { user_id, pay_option } = req.body;

    const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
    if (!session) return;

    const location_id = session.user.selected_location_id;

    if (!user_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_user_id" });
    }

    const user = await prisma.user.findFirst({
      where: { id: user_id, deleted_status: false, location_id },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "user_not_found" });
    }

    const payroll = await prisma.payroll.findUnique({ where: { user_id } });
    if (!payroll) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "payroll_not_found" });
    }

    const perHourRate = payroll.salary ?? 0;
    const commissionPercent = payroll.commission ?? 0;
    const tipDeductionPercent = payroll.tip_deduction ?? 0;

    const lastPayment = await prisma.payroll_payment.findFirst({
      where: { user_id },
      orderBy: { paid_at: "desc" },
    });

    const fromDate = lastPayment?.paid_at ?? new Date(user.created_at);
    const toDate = new Date();

    const clockIns = await prisma.user_clock_in.findMany({
      where: {
        user_id,
        clock_in: { gte: fromDate },
        clock_out: { not: null },
      },
      select: { clock_in: true, clock_out: true },
    });

    let totalWorkedHours = 0;
    for (const ci of clockIns) {
      const diffMs = new Date(ci.clock_out!).getTime() - new Date(ci.clock_in).getTime();
      totalWorkedHours += diffMs / (1000 * 60 * 60);
    }

    totalWorkedHours = parseFloat(totalWorkedHours.toFixed(2));
    const earnedTotalSalary = totalWorkedHours * perHourRate;

    const paidTips = await prisma.staff_tip.findMany({
      where: {
        user_id,
        OR: [
          {
            tip_type: "CASH",
            created_at: { gte: fromDate, lte: toDate },
          },
          {
            tip_type: "CHECK",
            check_paid_amount: { gt: 0 },
            check_last_paid_at: { gte: fromDate, lte: toDate },
          },
        ],
      },
    });

    let tipCash = 0;
    let tipCard = 0;
    let tipOther = 0;

    for (const tip of paidTips) {
      if (tip.tip_type === "CASH") {
        tipCash += tip.cash_amount ?? tip.tip;
      } else if (tip.tip_type === "CHECK") {
        tipOther += tip.check_paid_amount ?? 0;
      }
    }

    const orderTips = await prisma.orders.findMany({
      where: {
        staff_id: user_id,
        verified: true,
        order_status: "COMPLETED",
        created_at: { gte: fromDate, lte: toDate },
      },
      select: {
        tip: true,
        payment_method: true,
      },
    });

    for (const order of orderTips) {
      const tipAmount = order.tip ?? 0;
      if (order.payment_method === "CASH") {
        tipCash += tipAmount;
      } else if (order.payment_method === "CARD") {
        tipCard += tipAmount;
      } else {
        tipOther += tipAmount;
      }
    }

    const totalTip = parseFloat((tipCash + tipCard + tipOther).toFixed(2));

    const deductedTipAmount = parseFloat(((tipCard * tipDeductionPercent) / 100).toFixed(2));

    const grossSalary = earnedTotalSalary + totalTip;
    const commissionAmount = parseFloat(((grossSalary * commissionPercent) / 100).toFixed(2));

    const netSalary = parseFloat((grossSalary - deductedTipAmount - commissionAmount).toFixed(2));

    const fetchUser = await prisma.user.findFirst({
      where: { id: user_id, deleted_status: false },
      select: { first_name: true, last_name: true },
    });

    let savedPay: any = await prisma.payroll_payment.create({
      data: {
        user_id,
        payroll_id: payroll.id,
        pay_period_start: fromDate,
        pay_period_end: toDate,
        total_tip: totalTip,
        per_hour_salary: perHourRate,
        worked_hours: totalWorkedHours,
        tip_deduction: deductedTipAmount,
        commission: commissionAmount,
        gross_salary: parseFloat(grossSalary.toFixed(2)),
        net_salary: netSalary,
      },
    });

    savedPay = {
      ...savedPay,
      staff_name: fetchUser?.first_name ?? "",
    };

    if (pay_option === "reset") {
      await prisma.payroll.update({
        where: { user_id },
        data: {
          salary: 0,
          hours: 0,
          commission: 0,
          tip_deduction: 0,
          total: 0,
        },
      });
    }

    return res.status(StatusCodes.OK).json({ message: "payroll_paid_successfully", savedPay });
  } catch (error) {
    console.error("Pay Individual Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}