import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ error: "method_not_allowed" });
    }

    let { reservation_id, location_id, pay_amount, mark_full_paid = false } = req.body;

    if (!reservation_id || typeof pay_amount !== "number" || pay_amount <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "reservation_id_and_valid_pay_amount_required",
      });
    }

    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user?.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "missing_location_id" });
    }

    const tip = await prisma.staff_tip.findFirst({
      where: {
        reservation_id,
        staff: {
          location_id,
          deleted_status: false,
        },
      },
      include: {
        staff: true,
      },
    });

    if (!tip) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "tip_not_found" });
    }

    if (tip.tip_type !== "CHECK" && tip.tip_type !== "SPLIT") {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "tip_is_not_check_type" });
    }

    const totalCheckAmount = tip.check_amount ?? 0;
    const alreadyPaid = tip.check_paid_amount;
    const remaining = totalCheckAmount - alreadyPaid;

    if (remaining <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "check_tip_already_fully_paid" });
    }

    const payNow = Math.min(pay_amount, remaining);
    const newPaid = Math.round((alreadyPaid + payNow) * 100) / 100;

    const isAutoFullyPaid = newPaid >= totalCheckAmount;
    const shouldMarkFullyPaid = isAutoFullyPaid || mark_full_paid === true;

    const updatedTip = await prisma.staff_tip.update({
      where: { id: tip.id },
      data: {
        check_paid_amount: newPaid,
        check_fully_paid: shouldMarkFullyPaid,
        check_last_paid_at: new Date(),
      },
    });

    return res.status(StatusCodes.OK).json({
      message: shouldMarkFullyPaid ? "check_tip_fully_paid" : "partial_check_tip_paid",
      data: {
        tip_id: tip.id,
        paid_now: payNow,
        total_paid: newPaid,
        remaining: Math.max(totalCheckAmount - newPaid, 0),
        check_fully_paid: shouldMarkFullyPaid,
        updated_at: updatedTip.check_last_paid_at,
      },
    });
  } catch (error) {
    console.error("Error paying check tip:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "internal_server_error",
    });
  }
}
