import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import validateAPI from "../../../../lib/valildateApi";
import moment from "moment";
import { combineDateWithTime } from "../../../../lib/combineDateWithTime";
import { handleStaffRotation } from "../../../../lib/handleStaffRotation";
import { sendNotification } from "../../../../lib/firebaseHelper";
import { handlePointsRedemption } from "../../../../lib/handlePointsRedemption";
import { awardLoyaltyPoints } from "../../../../lib/awardLoyaltyPoints";
import { AppointmentConfirmationEmailTemplate } from "@/emailTemplates/AppointmentConfirmationEmailTemplate";
import sendEmail from "../../../../lib/sendEmail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let {
      location_id,
      date,
      staff_id,
      user_id,
      payment_method = "cash",
      time_slot,
      total_price,
      gift_code,
      final_price,
      reservation,
      customer_first_name,
      customer_last_name,
      customer_email,
      customer_phone,
      customer_altPhone,
      device_id = null,
      fcm_token = "",
      payment_intent,
      redeem_points = 0,
    } = req.body;

    let session = null;

    if (!location_id) {
      session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_location_id" });
    }

    if (
      !date ||
      !reservation?.length ||
      !customer_first_name ||
      !customer_email ||
      !customer_phone ||
      !time_slot?.start_time
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_required_fields" });
    }

    if (gift_code) {
      const giftCard = await prisma.gift_card.findFirst({
        where: {
          card_code: gift_code,
          active_status: true,
          deleted_status: false,
          OR: [
            { expiry_date: null },
            { expiry_date: { gte: new Date() } },
          ],
        },
      });

      if (!giftCard) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "gift_card_invalid_or_expired" });
      }

      if (giftCard.times_used >= giftCard.number_of_times) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "gift_card_usage_limit_reached" });
      }

      if (giftCard.amount <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "gift_card_balance_empty" });
      }

      await prisma.gift_card.update({
        where: { id: giftCard.id },
        data: {
          times_used: { increment: 1 },
        },
      });
    }

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

    const schedule_start_time = combineDateWithTime(date, time_slot.start_time);
    const schedule_end_time = combineDateWithTime(date, time_slot.end_time);

    if (isNaN(schedule_start_time.getTime()) || (schedule_end_time && isNaN(schedule_end_time.getTime()))) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "invalid_time_format" });
    }

    const isStaffReserved = await prisma.reservations.findFirst({
      where: {
        staff_id,
        location_id,
        schedule_start_time: { lt: schedule_end_time },
        schedule_end_time: { gt: schedule_start_time },
      },
    });

    if (isStaffReserved) {
      return res.status(StatusCodes.CONFLICT).json({ message: "staff_already_reserved_in_this_time_slot" });
    }

    let reservationCustomer: any = null;
    let createdReservation: any = null;

    const result = await prisma.$transaction(async tx => {
      reservationCustomer = await tx.reservation_customer.findFirst({
        where: { email: customer_email },
      });

      if (!reservationCustomer) {
        reservationCustomer = await tx.reservation_customer.create({
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

      createdReservation = await tx.reservations.create({
        data: {
          reservation_number: Math.floor(100000 + Math.random() * 900000),
          staff_id: staff_id || null,
          price_total: final_price,
          location_id,
          reservation_customer_id: reservationCustomer.id,
          schedule_start_time,
          schedule_end_time,
          reservation_date: moment.utc(date, "YYYY-MM-DD").toDate(),
          reservation_status: "PENDING",
          device_id,
        },
      });

      const reservationDetails = await Promise.all(
        reservation.map(async (item: any) => {
          const service = await tx.services.findUnique({ where: { id: item.service_id } });
          if (!service) return null;

          return tx.reservation_details.create({
            data: {
              reservation_id: createdReservation.id,
              service_id: item.service_id,
              service_name: service.name,
              service_price: item.price,
              quantity: item.quantity || 1,
              location_id,
            },
          });
        })
      );

      let payment_status: "PENDING" | "SUCCESS" | "FAILED" = "PENDING";
      const transaction_type = payment_method.toUpperCase();

      if (transaction_type === "CARD" && payment_intent?.id) {
        payment_status = payment_intent.status?.toLowerCase() === "succeeded" ? "SUCCESS" : "FAILED";
      }

      let transactionDetail = null;
      if (transaction_type === "CARD" && payment_intent?.id) {
        transactionDetail = await tx.transaction_details.create({
          data: {
            value: payment_intent.amount / 100,
            currency: payment_intent.currency || "usd",
            success: payment_intent.status?.toLowerCase() === "succeeded",
            payment_method: payment_intent.paymentMethod?.paymentMethodType || "card",
            card_summary: payment_intent.paymentMethod?.Card?.last4 || null,
            card_holder_name: payment_intent.paymentMethod?.billingDetails?.name || null,
            card_bin: null,
            stripe_payment_intent_id: payment_intent.id,
            stripe_customer_id: payment_intent.paymentMethod?.customerId || null,
            stripe_charge_id: null,
            stripe_invoice_id: null,
            stripe_status: payment_intent.status || null,
          },
        });
      }

      const transaction = await tx.reservation_transaction.create({
        data: {
          reservation_id: createdReservation.id,
          type: transaction_type,
          payment_status,
          amount: final_price,
          reservation_tip: 0,
          transaction_detail_id: transactionDetail?.id || null,
        },
      });

      let user: any = null;
      const customer = await tx.customers.findFirst({ where: { id: user_id } });
      if (customer) {
        user = customer;
      } else {
        const staff = await tx.user.findFirst({ where: { id: user_id } });
        if (staff) {
          user = staff;
        }
      }

      if (user?.fcm_token) {
        try {
          await sendNotification(
            user.fcm_token,
            "Appointment Confirmed",
            `Hi ${customer_first_name}, your appointment has been successfully booked.`,
            {
              reservationId: createdReservation.id,
              reservationDate: date,
              reservationTime: `${time_slot.start_time} - ${time_slot.end_time}`,
            }
          );
        } catch (err) {
          console.error("Error sending confirmation notification:", err);
        }
      }

      if (staff_id && staff_id !== user_id) {
        const staffUser = await tx.user.findUnique({
          where: { id: staff_id },
          select: { fcm_token: true, first_name: true },
        });

        if (staffUser?.fcm_token && staffUser.fcm_token !== user?.fcm_token) {
          try {
            await sendNotification(
              staffUser.fcm_token,
              "New Appointment Assigned",
              `You have a new appointment with ${customer_first_name}.`,
              {
                reservationId: createdReservation.id,
                customerName: `${customer_first_name} ${customer_last_name || ""}`.trim(),
                reservationDate: date,
                reservationTime: `${time_slot.start_time} - ${time_slot.end_time}`,
              }
            );
          } catch (err) {
            console.error("Error sending notification to staff:", err);
          }
        }
      }

      return {
        reservationCustomer,
        createdReservation,
        reservationDetails: reservationDetails.filter(Boolean),
        transaction,
        payment_status,
      };
    });

    const fetchedNewReservation = await prisma.reservations.findUnique({
      where: { id: createdReservation.id },
    });

    if (fetchedNewReservation?.id) {
      if (redeem_points > 0) {
        await handlePointsRedemption({
          user_id: reservationCustomer?.id,
          location_id,
          reservation_id: fetchedNewReservation.id,
          redeemPoints: redeem_points,
        });
      }

      if (result.payment_status === "SUCCESS") {
        await awardLoyaltyPoints({
          user_id: result.reservationCustomer.id,
          location_id,
          reservation_id: fetchedNewReservation.id,
          final_price: parseFloat(final_price),
          payment_status: result.payment_status,
        });
      }
    }

    const staffRotation = await handleStaffRotation(staff_id, location_id, final_price);

    const html = AppointmentConfirmationEmailTemplate(
      {
        customer_first_name,
        start_time: moment(time_slot.schedule_start_time).format("h:mm A"),
        end_time: moment(time_slot.schedule_end_time).format("h:mm A"),
        date:moment(time_slot.date).format("MMMM D, YYYY")
      }
    );

    await sendEmail(customer_email, "Your Appointment is Done", "", html);


    return res.status(StatusCodes.CREATED).json({
      message: "reservation_created_successfully",
      reservation: result.createdReservation,
      reservation_details: result.reservationDetails,
      transaction: result.transaction,
      staff_rotation: staffRotation,
    });
  } catch (error) {
    console.error("Reservation Create Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
