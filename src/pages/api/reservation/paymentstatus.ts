import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import validateAPI from "../../../../lib/valildateApi";
import { awardLoyaltyPoints } from "../../../../lib/awardLoyaltyPoints";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
    }

    let { reservation_id, location_id, payment_status } = req.body;

    if (!reservation_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_reservation_id" });
    }

    let session = null;
    if (!location_id) {
      session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_or_invalid_location" });
    }

    if (!payment_status) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_payment_status" });
    }

    const validStatuses = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"];
    if (!validStatuses.includes(payment_status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "invalid_payment_status" });
    }

    const reservation = await prisma.reservations.findUnique({
      where: { id: reservation_id, location_id },
      include: {
        reservation_transaction: true,
      },
    });

    if (!reservation) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "reservation_not_found" });
    }

    if (reservation.location_id !== location_id) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: "location_mismatch" });
    }

    const currentStatus = reservation.reservation_transaction?.payment_status;

    if (!currentStatus) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "no_transaction_found" });
    }

    if (
      (currentStatus === "FAILED" || currentStatus === "REFUNDED") &&
      payment_status === "SUCCESS"
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "cannot_change_failed_or_refunded_to_success",
      });
    }

    if (!reservation.reservation_transaction) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "no_transaction_found" });
    }

    await prisma.reservation_transaction.update({
      where: { id: reservation.reservation_transaction.id },
      data: { payment_status },
    });

    if (payment_status === "SUCCESS") {
      const reservationCustomer = await prisma.reservation_customer.findUnique({
        where: { id: reservation.reservation_customer_id },
      });

      if (reservationCustomer) {
        await awardLoyaltyPoints({
          user_id: reservationCustomer.id,
          location_id,
          reservation_id,
          final_price: reservation.price_total,
          payment_status,
        });
      }
    }

    return res.status(StatusCodes.OK).json({
      message: "payment_status_updated",
      reservation_id,
      new_payment_status: payment_status,
    });
  } catch (error) {
    console.error("Update Payment Status Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
