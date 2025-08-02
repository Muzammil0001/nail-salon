import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
  }

  try {
    let { reservation_id, location_id } = req.body;

    if (!reservation_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_reservation_id" });
    }

    let session = null;

    if (!location_id) {
      session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      const { user } = session;
      location_id = user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_location_id" });
    }

    const reservation = await prisma.reservations.findUnique({
      where: { id: reservation_id, reservation_status:"PENDING" },
      include: {
        reservation_customer: true,
        reservation_details: {include:{service:true}},
        reservation_transaction: {
          include: {
            transaction_detail: true,
          },
        },
      },
    });

    if (!reservation) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "reservation_not_found" });
    }

    const customer = reservation.reservation_customer;
    const reservationDetails = reservation.reservation_details;
    const transaction = reservation.reservation_transaction;
    const transactionDetail = transaction?.transaction_detail ?? null;

    const responsePayload = {
      location_id: reservation.location_id,
      date: reservation.reservation_date,
      payment_status: transaction?.payment_status,
      staff_id: reservation.staff_id,
      time_slot: {
        start_time: reservation.schedule_start_time,
        end_time: reservation.schedule_end_time,
      },
      total_price: reservation.price_total,
      reservation: reservationDetails.map((detail) => ({
        service_id: detail.service_id,
        price: detail.service_price,
        quantity: detail.quantity,
        category_id: detail.service?.category_id,
      })),
      customer_first_name: customer.first_name,
      customer_last_name: customer.last_name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      customer_altPhone: customer.alternate_phone,
      device_id: reservation.device_id,
      payment_method: transaction?.type === "CARD" ? "card" : "cash",
      fcm_token: customer.fcm_token,
      payment_intent: transactionDetail
        ? {
            id: transactionDetail.stripe_payment_intent_id,
            amount: parseFloat(transactionDetail.value?.toString() || "0") * 100,
            currency: transactionDetail.currency,
            status: transactionDetail.stripe_status,
            payment_method_types: [transactionDetail.payment_method],
          }
        : null,
    };

    return res.status(StatusCodes.OK).json({
      message: "reservation_fetched_successfully",
      reservation: responsePayload,
    });
  } catch (error) {
    console.error("Fetch Reservation Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
