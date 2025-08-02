import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { logActivity } from "../../../../lib/logActivity";
import validateAPI from "../../../../lib/valildateApi";

const VALID_STATUSES = ["PENDING", "INCOMPLETE", "COMPLETED", "CANCELED"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let { id, location_id, status } = req.body;

    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "missing_location_id" });
    }

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "id_is_required" });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "invalid_status_value" });
    }

    const existingReservation = await prisma.reservations.findFirst({
      where: {
        id,
        verified: true,
        deleted_status: false,
        location_id,
      },
      include: {
        reservation_transaction: true,
      },
    });

    if (!existingReservation) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "reservation_not_found_or_deleted",
      });
    }

    if (
      status === "COMPLETED" &&
      existingReservation.reservation_transaction?.payment_status !== "SUCCESS"
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "cannot_mark_as_completed_until_payment_successful",
      });
    }

    const updatedReservation = await prisma.reservations.update({
      where: { id },
      data: {
        reservation_status: status || "PENDING",
      },
    });

    await logActivity({
      message: `Reservation status updated successfully.`,
      req,
      res,
    });

    return res.status(StatusCodes.OK).json({
      message: "appointment_updated_successfully",
      updatedReservation,
    });
  } catch (error) {
    console.error("API error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
