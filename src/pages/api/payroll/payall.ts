import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
  }

  try {
    const { payload, pay_option } = req.body;

    const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
    if (!session) return;

    const location_id = session.user.selected_location_id;
    const now = new Date();

    if (!Array.isArray(payload)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "invalid_payload" });
    }

    const paidRecord = [];

    for (const entry of payload) {
      const { user_id } = entry;
      if (!user_id) continue;

      const user = await prisma.user.findFirst({
        where: { id: user_id, deleted_status: false, location_id },
        select: {
          first_name: true,
          last_name: true,
        },
      });
      if (!user) continue;

      const payroll = await prisma.payroll.findUnique({ where: { user_id } });
      if (!payroll) continue;

      const lastPayment = await prisma.payroll_payment.findFirst({
        where: { user_id },
        orderBy: { paid_at: "desc" },
      });

      const payPeriodStart = lastPayment?.paid_at ?? payroll.updated_at;

      const clockIns = await prisma.user_clock_in.findMany({
        where: {
          user_id,
          clock_out: { not: null },
          clock_in: { gte: payPeriodStart },
        },
        select: { clock_in: true, clock_out: true },
      });

      let totalWorkedHours = 0;
      for (const ci of clockIns) {
        const start = new Date(ci.clock_in);
        const end = new Date(ci.clock_out!);
        totalWorkedHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }

      totalWorkedHours = parseFloat(totalWorkedHours.toFixed(2));
      const perHourRate = payroll.salary ?? 0;
      const earnedSalary = totalWorkedHours * perHourRate;

      const paidTips = await prisma.staff_tip.findMany({
        where: {
          user_id,
          OR: [
            {
              tip_type: "CASH",
              created_at: { gte: payPeriodStart, lte: now },
            },
            {
              tip_type: "CHECK",
              check_paid_amount: { gt: 0 },
              check_last_paid_at: { gte: payPeriodStart, lte: now },
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
          created_at: { gte: payPeriodStart, lte: now },
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

      const tipDeductionPercent = payroll.tip_deduction ?? 0;
      const deductedTips = parseFloat(((tipCard * tipDeductionPercent) / 100).toFixed(2));

      const totalTip = parseFloat((tipCash + tipCard + tipOther).toFixed(2));

      const commissionPercent = payroll.commission ?? 0;
      const gross = earnedSalary + totalTip;
      const commissionAmount = parseFloat(((gross * commissionPercent) / 100).toFixed(2));

      const net = parseFloat((gross - deductedTips - commissionAmount).toFixed(2));

      const savedPay = await prisma.payroll_payment.create({
        data: {
          user_id,
          total_tip: totalTip,
          payroll_id: payroll.id,
          pay_period_start: payPeriodStart,
          pay_period_end: now,
          per_hour_salary: perHourRate,
          commission: commissionAmount,
          worked_hours: totalWorkedHours,
          tip_deduction: deductedTips,
          gross_salary: parseFloat(gross.toFixed(2)),
          net_salary: net,
        },
      });

      paidRecord.push({
        ...savedPay,
        staff_name: user.first_name,
      });

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
    }

    return res.status(StatusCodes.OK).json({
      message: "payrolls_paid_successfully",
      paidSalaries: paidRecord,
    });
  } catch (error) {
    console.error("Pay All Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
