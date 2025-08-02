import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ error: "method_not_allowed" });
    }

    let {
      staff_id,
      tip_amount,
      reservation_id,
      location_id,
      tip_type = "CASH",
    } = req.body;

    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user?.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "missing_location_id" });
    }

    if (!staff_id || typeof tip_amount !== "number" || !reservation_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "staff_id_tip_amount_reservation_id_required",
      });
    }

    let cash_amount = 0;
    let check_amount = 0;

    if (tip_type === "SPLIT") {
      cash_amount = Number((tip_amount / 2).toFixed(2));
      check_amount = Number((tip_amount - cash_amount).toFixed(2));
    } else if (tip_type === "CASH") {
      cash_amount = tip_amount;
    } else if (tip_type === "CHECK") {
      check_amount = tip_amount;
    }

    const staffUser = await prisma.user.findFirst({
      where: { id: staff_id, location_id, deleted_status: false },
    });

    if (!staffUser) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "staff_not_found" });
    }

    const reservation = await prisma.reservations.findFirst({
      where: {
        id: reservation_id,
        location_id,
        verified: true,
        deleted_status: false,
        reservation_status: "COMPLETED",
      },
    });

    if (!reservation) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "appointment_not_found" });
    }

    const existingTip = await prisma.staff_tip.findUnique({
      where: {
        user_id_reservation_id: {
          user_id: staff_id,
          reservation_id,
        },
      },
    });

    if (existingTip) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "tip_already_exists",
      });
    }

    const tip = await prisma.staff_tip.create({
      data: {
        user_id: staff_id,
        reservation_id,
        tip: tip_amount,
        tip_type,
        cash_amount,
        check_amount,
        check_paid_amount: 0,
        check_fully_paid: false,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "tip_added_successfully",
      data: tip,
    });
  } catch (error) {
    console.error("Internal Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "internal_server_error" });
  }
}
