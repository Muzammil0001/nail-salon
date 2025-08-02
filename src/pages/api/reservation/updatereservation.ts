import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import validateAPI from "../../../../lib/valildateApi";
import { Prisma } from "@prisma/client";
import { combineDateWithTime } from "../../../../lib/combineDateWithTime";
import { sendNotification } from "../../../../lib/firebaseHelper";
import moment from "moment";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
    }

    let {
      reservation_id,
      location_id,
      date,
      user_id,
      staff_id,
      time_slot,
      total_price,
      final_price,
      reservation,
      customer_first_name,
      customer_last_name,
      customer_email,
      customer_phone,
      customer_altPhone,
      device_id,
      fcm_token = "",
      payment_method = "cash",
      payment_intent,
      client_id,
    } = req.body;

    if (!reservation_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_reservation_id" });
    }

    let session = null;
    if (!location_id) {
      session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    if (
      !location_id || !date || !reservation?.length || !customer_first_name ||
      !customer_email || !customer_phone || !time_slot?.start_time
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_required_fields" });
    }

    const today = moment().startOf("day");
    const inputDate = moment(date).startOf("day");
    const finalReservationDate = inputDate.isBefore(today) ? today : inputDate;
    const finalDateStr = finalReservationDate.format("YYYY-MM-DD");
    
    const existingReservation = await prisma.reservations.findUnique({
      where: { id: reservation_id },
      include: {
        reservation_customer: true,
        reservation_transaction: { include: { transaction_detail: true } },
      },
    });

    if (!existingReservation) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "reservation_not_found" });
    }

    if (existingReservation.reservation_status === "COMPLETED") {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "reservation_already_completed" });
    }

    const isPendingReservation = existingReservation.reservation_status === "PENDING";
    const isPendingPayment = existingReservation.reservation_transaction?.payment_status === "PENDING";

    if (!isPendingReservation) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "reservation_update_not_allowed" });
    }

    if (!device_id) {
      device_id = existingReservation.device_id || existingReservation.reservation_customer.device_id || null;
    }

    if (
      existingReservation.reservation_transaction?.payment_status === "SUCCESS" &&
      existingReservation.reservation_transaction?.type !==
      (payment_method === "card" || payment_method === "qr" ? "CARD" : "CASH")
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "payment_method_change_not_allowed" });
    }

    await prisma.reservation_customer.update({
      where: { id: existingReservation.reservation_customer_id },
      data: {
        first_name: customer_first_name,
        last_name: customer_last_name || null,
        email: customer_email,
        phone: customer_phone,
        alternate_phone: customer_altPhone || null,
        device_id,
        fcm_token,
      },
    });

    const serviceIds: string[] = reservation.map((item: { service_id: string }) => item.service_id);
    const existingServices = await prisma.services.findMany({
      where: { id: { in: serviceIds }, deleted_status: false },
    });

    const existingServiceIds = new Set(existingServices.map(service => service.id));
    const invalidServices = serviceIds.filter(id => !existingServiceIds.has(id));
    if (invalidServices.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "service_not_found",
        invalid_services: invalidServices,
      });
    }

    if (staff_id) {
      const staff = await prisma.user.findUnique({ where: { id: staff_id } });
      if (!staff || staff.deleted_status) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: "staff_not_found" });
      }
    }

    const schedule_start_time = combineDateWithTime(finalDateStr, time_slot.start_time)
    const schedule_end_time = combineDateWithTime(finalDateStr, time_slot.end_time)

    if (isNaN(schedule_start_time.getTime()) || (schedule_end_time && isNaN(schedule_end_time.getTime()))) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "invalid_time_format" });
    }

    if (staff_id && schedule_end_time) {
      const conflictingReservation = await prisma.reservations.findFirst({
        where: {
          id: { not: reservation_id },
          staff_id,
          location_id,
          reservation_status: "PENDING",
          reservation_date: new Date(date),
          OR: [
            {
              schedule_start_time: { lt: schedule_end_time },
              schedule_end_time: { gt: schedule_start_time },
            },
            {
              schedule_start_time,
            },
            {
              schedule_end_time,
            },
          ],
        },
      });

      if (conflictingReservation) {
        return res.status(StatusCodes.CONFLICT).json({
          message: "staff_schedule_conflict",
          conflicting_reservation_id: conflictingReservation.id,
        });
      }
    }

    let transactionDetailId: string | null = null;
    let paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" = "PENDING";
    let transactionType: "CASH" | "CARD" = payment_method === "card" || payment_method === "qr" ? "CARD" : "CASH";

    if (payment_intent?.id && transactionType === "CARD") {
      if (!isPendingPayment) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "payment_already_processed" });
      }

      const data: any = {
        value: new Prisma.Decimal(payment_intent.amount / 100),
        currency: payment_intent.currency,
        success: payment_intent.status === "succeeded",
        payment_method: payment_intent.payment_method_types?.[0] || "unknown",
        stripe_payment_intent_id: payment_intent.id,
        stripe_status: payment_intent.status,
      };

      if (client_id) {
        data.client_id = client_id;
      }

      const transactionDetail = await prisma.transaction_details.create({ data });
      transactionDetailId = transactionDetail.id;

      paymentStatus = payment_intent.status === "succeeded" ? "SUCCESS" : "FAILED";
    }

    await prisma.reservation_transaction.upsert({
      where: { reservation_id },
      update: {
        type: transactionType,
        payment_status: paymentStatus,
        transaction_detail_id: transactionDetailId,
      },
      create: {
        reservation_id,
        amount: final_price,
        type: transactionType,
        payment_status: paymentStatus,
        transaction_detail_id: transactionDetailId,
      },
    });

    await prisma.reservations.update({
      where: { id: reservation_id },
      data: {
        staff_id: staff_id || null,
        price_total: final_price,
        location_id,
        schedule_start_time: schedule_start_time,
        schedule_end_time: schedule_end_time,
        reservation_date: new Date(date),
        device_id,
      },
    });

    await prisma.reservation_details.deleteMany({ where: { reservation_id } });

    for (const item of reservation) {
      const service = await prisma.services.findUnique({ where: { id: item.service_id } });
      if (!service) continue;

      const quantity = item.quantity || 1;

      await prisma.reservation_details.create({
        data: {
          reservation_id,
          service_id: item.service_id,
          service_name: service.name,
          service_price: item.price,
          quantity,
          location_id,
        },
      });
    }

    let user: any = null;

    const customer = await prisma.customers.findFirst({ where: { id: user_id } });

    if (customer) {
      user = customer;
    } else {
      user = await prisma.user.findFirst({ where: { id: user_id } });
    }

    const formattedTime = `${time_slot.start_time} - ${time_slot.end_time}`;
    const notificationPayload = {
      reservationId: String(reservation_id),
      reservationDate: date,
      startTime: time_slot.start_time,
      endTime: time_slot.end_time,
      updated: "true",
    };

    if (user?.fcm_token) {
      try {
        await sendNotification(
          user.fcm_token,
          "Appointment Updated",
          `Hi ${customer_first_name}, your appointment has been updated successfully.`,
          notificationPayload
        );
      } catch (err) {
        console.error("Error sending notification to user:", err);
      }
    }

    if (staff_id && staff_id !== user_id) {
      const staffUser = await prisma.user.findUnique({
        where: { id: staff_id },
        select: { fcm_token: true, first_name: true },
      });

      if (staffUser?.fcm_token && staffUser.fcm_token !== user?.fcm_token) {
        try {
          const customerName = `${customer_first_name} ${customer_last_name || ""}`.trim();
          await sendNotification(
            staffUser.fcm_token,
            "Appointment Updated",
            `Your appointment with ${customerName} has been updated to ${formattedTime}.`,
            {
              ...notificationPayload,
              customerName,
            }
          );
        } catch (err) {
          console.error("Error sending notification to staff:", err);
        }
      }
    }

    return res.status(StatusCodes.OK).json({
      message: "reservation_updated_successfully",
      updated_reservation: {
        reservation_id,
        location_id,
        date,
        staff_id,
        time_slot,
        final_price,
        reservation,
        customer_first_name,
        customer_last_name,
        customer_email,
        customer_phone,
        customer_altPhone,
        device_id,
        fcm_token,
        payment_method: transactionType,
        payment_status: paymentStatus,
        ...(transactionDetailId ? { transaction_detail_id: transactionDetailId, payment_intent } : {}),
      },
    });
  } catch (error) {
    console.error("Reservation Update Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
