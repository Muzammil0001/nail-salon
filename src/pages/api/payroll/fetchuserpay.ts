import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import moment from "moment";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
  }

  try {
    let { location_id, user_id, option } = req.body;

    if (!user_id || !["daily", "weeekly"].includes(option)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "invalid_user_or_option" });
    }

    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
        location_id,
        deleted_status: false,
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "user_not_found" });
    }

    const payroll = await prisma.payroll.findUnique({ where: { user_id } });
    const rate = payroll?.salary ?? 0;
    const tipDeductionPercent = payroll?.tip_deduction ?? 0;

    const lastPaid = await prisma.payroll_payment.findFirst({
      where: { user_id },
      orderBy: { paid_at: "desc" },
    });

    const fromDate = lastPaid?.paid_at ? moment(lastPaid.paid_at) : moment().startOf("week");
    const now = moment();

    const groupedData: any[] = [];

    if (option === "weeekly") {
      let currentWeekStart = fromDate.clone().startOf("week");

      while (currentWeekStart.isBefore(now)) {
        const currentWeekEnd = moment.min(currentWeekStart.clone().endOf("week"), now);

        const clockIns = await prisma.user_clock_in.findMany({
          where: {
            user_id,
            clock_out: { not: null },
            AND: [
              {
                clock_in: {
                  gte: currentWeekStart.clone().startOf("day").toDate(),
                },
              },
              {
                clock_in: {
                  lte: currentWeekEnd.clone().endOf("day").toDate(),
                },
              },
            ],
          },
        });

        let hours = 0;
        for (const ci of clockIns) {
          const start = new Date(ci.clock_in);
          const end = new Date(ci.clock_out!);
          hours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }

        const netSalary = hours * rate;

        const paidTips = await prisma.staff_tip.findMany({
          where: {
            user_id,
            OR: [
              { tip_type: "CASH", created_at: { gte: currentWeekStart.toDate(), lte: currentWeekEnd.toDate() } },
              { tip_type: "CHECK", created_at: { gte: currentWeekStart.toDate(), lte: currentWeekEnd.toDate() } },
            ],
          },
        });

        // tips from orders
        const orderTips = await prisma.orders.findMany({
          where: {
            staff_id: user_id,
            verified: true,
            order_status: "COMPLETED",
            created_at: {
              gte: currentWeekStart.toDate(),
              lte: currentWeekEnd.toDate(),
            },
          },
          select: {
            tip: true,
            payment_method: true,
          },
        });

        let tipCash = 0;
        let tipCard = 0;
        let tipOther = 0;

        for (const tip of paidTips) {
          if (tip.tip_type === "CASH") tipCash += tip.cash_amount ?? tip.tip;
          else if (tip.tip_type === "CHECK") tipOther += tip.check_paid_amount ?? 0;
        }

        for (const order of orderTips) {
          const amount = order.tip ?? 0;
          if (order.payment_method === "CASH") tipCash += amount;
          else if (order.payment_method === "CARD") tipCard += amount;
          else tipOther += amount;
        }

        const deductedTip = (tipCard * tipDeductionPercent) / 100;
        const totalTip = parseFloat((tipCash + tipCard + tipOther - deductedTip).toFixed(2));

        if (clockIns.length > 0) {
          groupedData.push({
            date: `${currentWeekStart.format("DD/MM")}-${currentWeekEnd.format("DD/MM")}`,
            staff_name: `${user.first_name}`,
            worked_hours: parseFloat(hours.toFixed(2)),
            tip: totalTip,
            salary: parseFloat(netSalary.toFixed(2)),
          });
        }

        currentWeekStart.add(1, "week");
      }
    } else {
      let currentDay = fromDate.clone().startOf("day");

      while (currentDay.isSameOrBefore(now, "day")) {
        const nextDay = currentDay.clone().endOf("day");

        const clockIns = await prisma.user_clock_in.findMany({
          where: {
            user_id,
            clock_in: { gte: currentDay.toDate(), lte: nextDay.toDate() },
            clock_out: { not: null },
          },
        });

        let hours = 0;
        for (const ci of clockIns) {
          const start = new Date(ci.clock_in);
          const end = new Date(ci.clock_out!);
          hours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }

        const netSalary = hours * rate;

        const paidTips = await prisma.staff_tip.findMany({
          where: {
            user_id,
            OR: [
              { tip_type: "CASH", created_at: { gte: currentDay.toDate(), lte: nextDay.toDate() } },
              { tip_type: "CHECK", created_at: { gte: currentDay.toDate(), lte: nextDay.toDate() } },
            ],
          },
        });

        const orderTips = await prisma.orders.findMany({
          where: {
            staff_id: user_id,
            verified: true,
            order_status: "COMPLETED",
            created_at: {
              gte: currentDay.toDate(),
              lte: nextDay.toDate(),
            },
          },
          select: {
            tip: true,
            payment_method: true,
          },
        });

        let tipCash = 0;
        let tipCard = 0;
        let tipOther = 0;

        for (const tip of paidTips) {
          if (tip.tip_type === "CASH") tipCash += tip.cash_amount ?? tip.tip;
          else if (tip.tip_type === "CHECK") tipOther += tip.check_paid_amount ?? 0;
        }

        for (const order of orderTips) {
          const amount = order.tip ?? 0;
          if (order.payment_method === "CASH") tipCash += amount;
          else if (order.payment_method === "CARD") tipCard += amount;
          else tipOther += amount;
        }

        const deductedTip = (tipCard * tipDeductionPercent) / 100;
        const totalTip = parseFloat((tipCash + tipCard + tipOther - deductedTip).toFixed(2));

        groupedData.push({
          date: currentDay.format("DD-MM-YY"),
          staff_name: `${user.first_name}`,
          worked_hours: parseFloat(hours.toFixed(2)),
          tip: parseFloat(totalTip.toFixed(2)),
          salary: parseFloat(netSalary.toFixed(2)),
        });

        currentDay.add(1, "day");
      }
    }

    return res.status(StatusCodes.OK).json({
      message: "payroll_fetched",
      data: groupedData,
    });
  } catch (error) {
    console.error("Fetch user payroll error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
