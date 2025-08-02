import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ error: "method_not_allowed" });
    }

    let { location_id, fetchAll = false, search = "", rowsPerPage = 25, page = 1 } = req.body;

    let session = null;
    if (!location_id) {
      session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user?.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "missing_location_id" });
    }

    const staffList = await prisma.user.findMany({
      where: {
        deleted_status: false,
        location_id,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    });

    const enrichedStaff = await Promise.all(
      staffList.map(async (staff) => {
        const [rotation, reservationCount, orderCount, payments, paidTips, orders, payroll] = await Promise.all([
          prisma.staff_service_rotation.findFirst({ where: { user_id: staff.id } }),

          prisma.reservations.count({
            where: {
              staff_id: staff.id,
            },
          }),

          prisma.orders.count({
            where: {
              staff_id: staff.id,
              deleted_status: false,
              verified: true,
            },
          }),

          prisma.payroll_payment.aggregate({
            _sum: {
              worked_hours: true,
              gross_salary: true,
              net_salary: true,
              commission: true,
              tip_deduction: true,
            },
            where: {
              user_id: staff.id,
            },
          }),

          prisma.staff_tip.findMany({
            where: {
              user_id: staff.id,
              OR: [
                { tip_type: "CASH", cash_amount: { gt: 0 } },
                { tip_type: "CHECK", check_paid_amount: { gt: 0 } },
              ],
            },
          }),

          prisma.orders.findMany({
            where: {
              staff_id: staff.id,
              verified: true,
              order_status: "COMPLETED",
            },
            select: {
              tip: true,
              payment_method: true,
              created_at: true,
            },
          }),

          prisma.payroll.findUnique({ where: { user_id: staff.id } }),
        ]);

        const totalWorkedHours = parseFloat((payments._sum.worked_hours ?? 0).toFixed(2));

        const hasActivity =
          totalWorkedHours > 0 || reservationCount > 0 || orderCount > 0 || paidTips.length > 0 || orders.length > 0;

        let totalEarnedTips = 0;
        let cardTip = 0;

        if (hasActivity) {
          for (const tip of paidTips) {
            if (tip.tip_type === "CASH") {
              totalEarnedTips += tip.cash_amount ?? tip.tip ?? 0;
            } else if (tip.tip_type === "CHECK") {
              totalEarnedTips += tip.check_paid_amount ?? 0;
            }
          }

          for (const order of orders) {
            const tipAmount = order.tip ?? 0;
            if (order.payment_method === "CARD") {
              totalEarnedTips += tipAmount;
              cardTip += tipAmount;
            } else {
              totalEarnedTips += tipAmount;
            }
          }
        }

        const gross = totalWorkedHours > 0 ? payments._sum.gross_salary ?? 0 : 0;
        const net = totalWorkedHours > 0 ? payments._sum.net_salary ?? 0 : 0;
        const totalCommission = totalWorkedHours > 0 ? payments._sum.commission ?? 0 : 0;

        const tipDeductionPercent = payroll?.tip_deduction ?? 0;
        const deductedTips = totalWorkedHours > 0
          ? parseFloat(((cardTip * tipDeductionPercent) / 100).toFixed(2))
          : 0;

        const earnedSalary = totalWorkedHours > 0
          ? parseFloat((gross - totalCommission - deductedTips).toFixed(2))
          : 0;

        return {
          id: staff.id,
          name: `${staff.first_name} ${staff.last_name}`,
          points: rotation?.points ?? 0,
          total_tips: parseFloat(totalEarnedTips.toFixed(2)),
          total_reservations: reservationCount + orderCount,
          total_worked_hours: totalWorkedHours,
          earned_total_salary: earnedSalary,
          earned_tips: parseFloat(totalEarnedTips.toFixed(2)),
          gross_salary: parseFloat(gross.toFixed(2)),
          net_salary: parseFloat(net.toFixed(2)),
          tip_deduction_amount: parseFloat(deductedTips.toFixed(2)),
          active_turn: false,
        };
      })
    );

    let filtered = enrichedStaff;
    if (search) {
      const lowered = search.toLowerCase();
      filtered = enrichedStaff.filter(u =>
        u.name.toLowerCase().includes(lowered) ||
        u.total_tips.toString().includes(lowered) ||
        u.total_reservations.toString().includes(lowered)
      );
    }

    const sorted = filtered.sort((a, b) => a.points - b.points);

    const currentTurnStaff = sorted.reduce((min, curr) => 
      curr.points < min.points ? curr : min
    );

    const total = sorted.length;
    let paginated = sorted;
    if (!fetchAll) {
      const safePage = Math.max(Number(page), 1);
      const safeRows = Math.max(Number(rowsPerPage), 1);
      paginated = sorted.slice((safePage - 1) * safeRows, safePage * safeRows);
    }

    const finalRotations = paginated.map(staff => ({
      ...staff,
      active_turn: staff.id === currentTurnStaff.id,
    }));

    return res.status(StatusCodes.OK).json({
      message: "staff_rotations_fetched",
      data: {
        rotations: finalRotations,
        count: total,
        current_turn_staff: finalRotations.find(r => r.id === currentTurnStaff.id),
      },
    });
  } catch (error) {
    console.error("Error fetching detailed staff rotations:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "internal_server_error" });
  }
}
