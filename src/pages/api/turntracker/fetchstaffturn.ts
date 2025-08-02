import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ error: "method_not_allowed" });
    }

    let { location_id, staff_id } = req.body;

    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user?.selected_location_id;
    }

    if (!location_id || !staff_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "missing_location_id_or_staff_id" });
    }

    const staff = await prisma.user.findFirst({
      where: { id: staff_id, deleted_status: false, location_id },
      select: { id: true, first_name: true, last_name: true },
    });

    if (!staff) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "staff_not_found" });
    }

    const payments = await prisma.payroll_payment.findMany({
      where: { user_id: staff_id },
      orderBy: { paid_at: "asc" },
    });

    const totalWorkedHours = payments?.reduce((sum, p) => sum + p.worked_hours, 0);
    const totalCommission = payments?.reduce((sum, p) => sum + (p.commission || 0), 0);
    const totalTipDeducted = payments?.reduce((sum, p) => sum + (p.tip_deduction || 0), 0);
    const totalGross = payments?.reduce((sum, p) => sum + p.gross_salary, 0);
    const totalNet = payments?.reduce((sum, p) => sum + p.net_salary, 0);

    const fromDate = payments[0]?.pay_period_start ?? null;
    const toDate = payments[payments.length - 1]?.pay_period_end ?? null;

    let totalCashTip = 0;
    let totalCheckTip = 0;

    if (fromDate && toDate) {
      const paidTips = await prisma.staff_tip.findMany({
        where: {
          user_id: staff_id,
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

      for (const tip of paidTips) {
        if (tip.tip_type === "CASH") {
          totalCashTip += tip.cash_amount ?? tip.tip;
        } else if (tip.tip_type === "CHECK" && tip.check_paid_amount > 0) {
          totalCheckTip += tip.check_paid_amount;
        }
      }
    }

    const [rotation, reservationCount] = await Promise.all([
      prisma.staff_service_rotation.findFirst({ where: { user_id: staff_id } }),
      prisma.reservations.count({
        where: { staff_id, reservation_status: "COMPLETED" },
      }),
    ]);

    const allRotations = await prisma.staff_service_rotation.findMany({
      where: {
        user_id: {
          in: (
            await prisma.user.findMany({
              where: { deleted_status: false, location_id },
              select: { id: true },
            })
          ).map(u => u.id),
        },
      },
    });

    const enrichedRotations = await Promise.all(
      allRotations.map(async (r) => {
        const tips = await prisma.staff_tip.aggregate({
          _sum: { tip: true },
          where: { user_id: r.user_id },
        });
        const resCount = await prisma.reservations.count({
          where: { staff_id: r.user_id, reservation_status: "COMPLETED" },
        });
        const clocks = await prisma.user_clock_in.findMany({
          where: { user_id: r.user_id, clock_out: { not: null } },
        });
        return { ...r, isActive: tips._sum.tip || resCount || clocks.length };
      })
    );

    const currentLowest = enrichedRotations
      .filter(r => r.isActive)
      .sort((a, b) => a.points - b.points)[0];

    const activeTurn = currentLowest?.user_id === staff_id;

    const result = {
      id: staff.id,
      name: `${staff.first_name} ${staff.last_name}`,
      from_date: fromDate,
      to_date: toDate,
      points: rotation?.points ?? 0,
      total_reservations: reservationCount,
      total_paid_worked_hours: parseFloat(totalWorkedHours.toFixed(2)),
      total_tip_deduction: parseFloat(totalTipDeducted.toFixed(2)),
      earned_gross_salary: parseFloat(totalGross.toFixed(2)),
      earned_net_salary: parseFloat(totalNet.toFixed(2)),
      total_cash_tip_paid: parseFloat(totalCashTip.toFixed(2)),
      total_check_tip_paid: parseFloat(totalCheckTip.toFixed(2)),
      total_paid_tips: parseFloat((totalCashTip + totalCheckTip).toFixed(2)),

      active_turn: activeTurn,
    };

    return res.status(StatusCodes.OK).json({
      message: "staff_total_earnings_from_payments",
      data: result,
    });
  } catch (error) {
    console.error("Error fetching earnings with active turn:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "internal_server_error" });
  }
}
