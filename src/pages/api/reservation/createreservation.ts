import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import validateAPI from "../../../../lib/valildateApi";
import { combineDateWithTime } from "../../../../lib/combineDateWithTime";
import { handleStaffRotation } from "../../../../lib/handleStaffRotation";
import { sendNotification } from "../../../../lib/firebaseHelper";
import { handlePointsRedemption } from "../../../../lib/handlePointsRedemption";
import { awardLoyaltyPoints } from "../../../../lib/awardLoyaltyPoints";
import sendEmail from "../../../../lib/sendEmail";
import { AppointmentConfirmationEmailTemplate } from "../../../emailTemplates/AppointmentConfirmationEmailTemplate";
import moment from "moment";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let {
      location_id,
      date,
      user_id,
      staff_id,
      time_slot,
      final_price,
      total_price,
      reservation,
      customer_first_name,
      customer_last_name,
      customer_email,
      customer_phone,
      customer_altPhone,
      device_id = null,
      payment_method,
      coupon_code,
      fcm_token = "",
      payment_intent,
      redeem_points = 0,
    } = req.body;

    let session = null;
    let client_id = null;

    if (!location_id) {
      session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      const { user } = session;
      client_id = user.roles.includes("Owner") ? user.id : user.client_id;
      location_id = user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_location_id" });
    }

    if (!date || !reservation?.length || !customer_first_name || !customer_email || !customer_phone || !time_slot?.start_time) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_required_fields" });
    }

    const today = moment().startOf("day");
    const inputDate:any = moment(date).startOf("day");
    const finalReservationDate:any = inputDate.isBefore(today) ? today : inputDate;
    const finalDateStr = finalReservationDate.format("YYYY-MM-DD");

    if (coupon_code) {
      const giftCard = await prisma.gift_card.findFirst({
        where: {
          card_code: coupon_code,
          active_status: true,
          deleted_status: false,
          OR: [
            { expiry_date: null },
            { expiry_date: { gte: new Date() } },
          ],
        },
      });

      if (!giftCard) return res.status(StatusCodes.BAD_REQUEST).json({ message: "gift_card_invalid_or_expired" });
      if (giftCard.times_used >= giftCard.number_of_times)
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "gift_card_usage_limit_reached" });
      if (giftCard.amount <= 0)
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "gift_card_balance_empty" });

      await prisma.gift_card.update({
        where: { id: giftCard.id },
        data: { times_used: { increment: 1 } },
      });
    }

    const serviceIds: string[] = reservation.map((item: { service_id: string }) => item.service_id);
    const existingServices = await prisma.services.findMany({
      where: { id: { in: serviceIds }, deleted_status: false },
    });

    const existingServiceIds = new Set(existingServices.map((service: any) => service.id));
    const invalidServices = serviceIds.filter(id => !existingServiceIds.has(id));

    if (invalidServices.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "service_not_found",
        invalid_services: invalidServices,
      });
    }

    if (staff_id) {
      const staff = await prisma.user.findUnique({ where: { id: staff_id } });
      if (!staff || staff.deleted_status)
        return res.status(StatusCodes.NOT_FOUND).json({ message: "staff_not_found" });
    }

    const isStaffReserved = await prisma.reservations.findFirst({
      where: {
        staff_id,
        location_id,
        verified: true,
        schedule_start_time: { lt: time_slot?.end_time },
        schedule_end_time: { gt: time_slot?.start_time },
      },
    });

    if (isStaffReserved) {
      return res.status(StatusCodes.CONFLICT).json({ message: "staff_already_reserved_in_this_time_slot" });
    }

    let reservationCustomer = await prisma.reservation_customer.findFirst({ where: { email: customer_email } });

    if (!reservationCustomer) {
      reservationCustomer = await prisma.reservation_customer.create({
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
    }

    const reservationRes = await prisma.reservations.create({
      data: {
        reservation_number: Math.floor(100000 + Math.random() * 900000),
        staff_id: staff_id || null,
        price_total: final_price,
        location_id,
        reservation_customer_id: reservationCustomer.id,
        schedule_start_time: combineDateWithTime(finalDateStr, time_slot.start_time),
        schedule_end_time: time_slot.end_time
          ? combineDateWithTime(finalDateStr, time_slot.end_time)
          : combineDateWithTime(finalDateStr, time_slot.start_time),
        reservation_date:  finalReservationDate,
        device_id,
      },
    });

    for (const item of reservation) {
      const service = await prisma.services.findUnique({ where: { id: item.service_id } });
      if (!service) continue;

      await prisma.reservation_details.create({
        data: {
          reservation_id: reservationRes.id,
          service_id: item.service_id,
          service_name: service.name,
          service_price: item.price,
          quantity: item.quantity || 1,
          location_id,
        },
      });
    }

    if (redeem_points > 0) {
      await handlePointsRedemption({
        user_id: reservationCustomer.id,
        location_id,
        reservation_id: reservationRes.id,
        redeemPoints: redeem_points,
      });
    }

    let transactionDetailId: string | null = null;
    let paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED" = "PENDING";
    const transactionType: "CASH" | "CARD" = payment_method === "card" || payment_method === "qr" ? "CARD" : "CASH";

    if (payment_intent?.id && transactionType === "CARD") {
      const data: any = {
        value: parseFloat(String(payment_intent.amount / 100)),
        currency: payment_intent.currency,
        success: payment_intent.status === "succeeded",
        payment_method: payment_intent.payment_method_types?.[0] || "unknown",
        stripe_payment_intent_id: payment_intent.id,
        stripe_status: payment_intent.status,
      };

      if (client_id) data.client_id = client_id;

      const transactionDetail = await prisma.transaction_details.create({ data });
      transactionDetailId = transactionDetail.id;

      paymentStatus = payment_intent.status === "succeeded" ? "SUCCESS" : "FAILED";
    }

    await prisma.reservation_transaction.create({
      data: {
        reservation_id: reservationRes.id,
        amount: final_price,
        type: transactionType,
        transaction_detail_id: transactionDetailId,
        payment_status: paymentStatus,
      },
    });

    if (paymentStatus === "SUCCESS") {
      await awardLoyaltyPoints({
        user_id: reservationCustomer.id,
        location_id,
        reservation_id: reservationRes.id,
        final_price,
        payment_status: paymentStatus,
      });
    }

    const staffRotation = await handleStaffRotation(staff_id, location_id, final_price);

    let user: any = await prisma.customers.findFirst({ where: { id: user_id } });
    if (!user) user = await prisma.user.findFirst({ where: { id: user_id } });

    const formattedTime = `${time_slot.start_time} - ${time_slot.end_time}`;
    const notificationPayload = {
      reservationId: reservationRes.id,
      reservationDate: finalReservationDate.format("YYYY-MM-DD"),
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
      const staffUser = await prisma.user.findFirst({
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
            { ...notificationPayload, customerName }
          );
        } catch (err) {
          console.error("Error sending notification to staff:", err);
        }
      }
    }

    const html = AppointmentConfirmationEmailTemplate({
      customer_first_name,
      start_time: moment(time_slot.start_time).format("h:mm A"),
      end_time: moment(time_slot.end_time).format("h:mm A"),
      date: finalReservationDate.format("MMMM D, YYYY"),
    });

    await sendEmail(customer_email, "Your Appointment is Done", "", html);

    return res.status(StatusCodes.CREATED).json({
      message: "reservation_created_successfully",
      reservation: reservationRes,
      staff_rotation: staffRotation,
    });

  } catch (error) {
    console.error("Reservation Create Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
