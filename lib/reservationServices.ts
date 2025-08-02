import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { StatusCodes } from "http-status-codes";
import { sendNotification } from './firebaseHelper';
import { awardLoyaltyPoints } from "./awardLoyaltyPoints";
import { handleStaffRotation } from './handleStaffRotation';
interface ReservationData {
  location_id: string;
  date: string | null;
  staff_id?: string;
  coupon_code?: string;
  time_slot: { start_time: string; end_time?: string };
  total_price: number;
  final_price: number;
  reservation: Array<{ service_id: string; price: number; quantity?: number }>;
  customer_first_name: string;
  customer_last_name?: string;
  customer_email: string;
  customer_phone: string;
  customer_altPhone?: string;
  payment_method: string;
  payment_intent: any;
  device_id?: string | null;
  fcm_token?: string;
  client_id?: string | null;
}


export async function confirmReservationPayment(
  reservationId: string,
  paymentIntent: any,
  couponCode:string,
) {

    if (couponCode) {
      const giftCard = await prisma.gift_card.findFirst({
        where: {
          card_code: couponCode,
          active_status: true,
          deleted_status: false,
          OR: [
            { expiry_date: null },
            { expiry_date: { gte: new Date() } },
          ],
        },
      });

      if (!giftCard) {
        return { success: false, message: "gift_card_invalid_or_expired" };
      }

      if (giftCard.times_used >= giftCard.number_of_times) {
        return { success: false, message: "gift_card_usage_limit_reached" };
      }

      if (giftCard.amount <= 0) {
        return { success: false, message: "gift_card_balance_empty" };
      }

      await prisma.gift_card.update({
        where: { id: giftCard.id },
        data: {
          times_used: { increment: 1 },
        },
      });
    }

  const reservation = await prisma.reservations.findUnique({
    where: { id: reservationId },
  });

  if (!reservation) {
    console.error(`Reservation with ID ${reservationId} not found`);
    return { success: false, message: "reservation_not_found" };
  }

  const updatedReservation = await prisma.reservations.update({
    where: { id: reservation.id },
    data: {
      verified: true,
      deleted_status: false,
      reservation_status: "PENDING",
    },
  });

  if (reservation.reservation_customer_id) {
    const reservationCustomer = await prisma.reservation_customer.update({
      where: { id: reservation.reservation_customer_id },
      data: { is_verified: true },
    });

    const staff_id=updatedReservation?.staff_id ?? "";
    const location_id=updatedReservation?.location_id ?? "";
    await handleStaffRotation(staff_id, location_id, updatedReservation?.price_total);

    await awardLoyaltyPoints({
      user_id: reservationCustomer.id,
      location_id: updatedReservation.location_id,
      reservation_id: updatedReservation.id,
      final_price: updatedReservation.price_total,
      payment_status: "SUCCESS",
    });

    if (reservationCustomer?.fcm_token && reservationCustomer?.is_verified) {
      try {
        await sendNotification(
          reservationCustomer.fcm_token,
          "Appointment Confirmed",
          `Hi ${reservationCustomer.first_name}, your appointment has been successfully booked.`,
          {
            reservationId: updatedReservation.id,
            reservationDate: updatedReservation.reservation_date,
            reservationTime: `${updatedReservation.schedule_start_time} - ${updatedReservation.schedule_end_time}`,
          }
        );
      } catch (err) {
        console.error("Error sending notification to customer:", err);
      }
    }

    if (updatedReservation.staff_id) {
      const staffUser = await prisma.user.findUnique({
        where: { id: updatedReservation.staff_id },
        select: { fcm_token: true, first_name: true },
      });

      if (staffUser?.fcm_token) {
        try {
          await sendNotification(
            staffUser.fcm_token,
            "New Appointment Assigned",
            `You have a new appointment with ${reservationCustomer.first_name}.`,
            {
              reservationId: updatedReservation.id,
              customerName: `${reservationCustomer.first_name} ${reservationCustomer.last_name || ""}`.trim(),
              reservationDate: updatedReservation.reservation_date,
              startTime: updatedReservation.schedule_start_time,
            }
          );
        } catch (err) {
          console.error("Error sending notification to staff:", err);
        }
      }
    }
  }

  const transactionData = {
    value: new Prisma.Decimal(paymentIntent?.amount / 100),
    currency: paymentIntent?.currency,
    success: paymentIntent?.status === "succeeded",
    payment_method: paymentIntent?.payment_method_types?.[0] || "unknown",
    stripe_payment_intent_id: paymentIntent?.id,
    stripe_status: paymentIntent?.status,
  };

  const transactionDetail = await prisma.transaction_details.create({
    data: transactionData,
  });

  const existingTransaction = await prisma.reservation_transaction.findFirst({
    where: { reservation_id: reservationId },
  });

  if (existingTransaction) {
    await prisma.reservation_transaction.update({
      where: { id: existingTransaction.id },
      data: {
        amount: updatedReservation?.price_total || 0,
        type: "CARD",
        payment_status: "SUCCESS",
        transaction_detail_id: transactionDetail.id,
      },
    });
  } else {
    await prisma.reservation_transaction.create({
      data: {
        reservation_id: reservationId,
        amount: updatedReservation?.price_total || 0,
        type: "CARD",
        payment_status: "SUCCESS",
        transaction_detail_id: transactionDetail.id,
      },
    });
  }

   

  return { success: true, message: "reservation_created_successfully" };
}


export async function saveReservationToDB(data: ReservationData): Promise<{ success: boolean; message?: string; reservation?: any }> {
  try {
    if (!data.location_id) {
      return { success: false, message: "missing_location_id" };
    }

    if (!data.date || !data.reservation?.length || !data.customer_first_name || !data.customer_email || !data.customer_phone || !data.time_slot?.start_time) {
      return { success: false, message: "missing_required_fields" };
    }

    const serviceIds = data.reservation.map(item => item.service_id);

    const existingServices = await prisma.services.findMany({
      where: { id: { in: serviceIds }, deleted_status: false },
    });

    const existingServiceIds = new Set(existingServices.map(s => s.id));
    const invalidServices = serviceIds.filter(id => !existingServiceIds.has(id));

    if (invalidServices.length > 0) {
      return { success: false, message: "service_not_found" };
    }

    if (data.staff_id) {
      const staff = await prisma.user.findUnique({ where: { id: data.staff_id } });
      if (!staff || staff.deleted_status) {
        return { success: false, message: "staff_not_found" };
      }
    }

    const reservationCustomer = await prisma.reservation_customer.create({
      data: {
        first_name: data.customer_first_name,
        last_name: data.customer_last_name || null,
        email: data.customer_email,
        phone: data.customer_phone,
        alternate_phone: data.customer_altPhone || null,
        device_id: data.device_id || null,
        fcm_token: data.fcm_token || "",
        is_verified: false,
      },
    });

    const reservationRes = await prisma.reservations.create({
      data: {
        reservation_number: Math.floor(100000 + Math.random() * 900000),
        staff_id: data.staff_id || null,
        price_total: data.final_price,
        location_id: data.location_id,
        reservation_customer_id: reservationCustomer.id,
        schedule_start_time: new Date(data.time_slot.start_time),
        schedule_end_time: data.time_slot.end_time ? new Date(data.time_slot.end_time) : "",
        reservation_date: new Date(data.date),
        device_id: data.device_id || null,
        verified: false,
        reservation_status: 'PENDING',
      },
    });

    for (const item of data.reservation) {
      const service = existingServices.find(s => s.id === item.service_id);
      if (!service) continue;

      const quantity = item.quantity || 1;

      await prisma.reservation_details.create({
        data: {
          reservation_id: reservationRes.id,
          service_id: item.service_id,
          service_name: service.name,
          service_price: item.price,
          quantity,
          location_id: data.location_id,
        },
      });
    }
    return { success: true, reservation: reservationRes };
  } catch (error) {
    console.error("Error saving reservation:", error);
    return { success: false, message: "internal_server_error" };
  }
}
