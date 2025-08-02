import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import validateAPI from "../../../../lib/valildateApi";
import { handleStaffRotation } from "../../../../lib/handleStaffRotation";
import { sendNotification } from "../../../../lib/firebaseHelper";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let {
      location_id,
      date,
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
      fcm_token = "",
    } = req.body;

    let session = null;

    if (!location_id) {
      session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      const { user } = session;
      location_id = user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_location_id",
      });
    }

    if (
      !date ||
      !reservation?.length ||
      !customer_first_name ||
      !customer_email ||
      !customer_phone ||
      !time_slot?.start_time
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_required_fields",
      });
    }

    let reservationCustomer = await prisma.reservation_customer.findFirst({
      where: { email: customer_email },
    });

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
        schedule_start_time: new Date(time_slot.start_time),
        schedule_end_time: time_slot.end_time ? new Date(time_slot.end_time) : "",
        reservation_date: new Date(date),
      },
    });

    for (const item of reservation) {
      const service = await prisma.services.findUnique({
        where: { id: item.service_id },
      });

      if (!service) continue;

      const quantity = item.quantity || 1;

      await prisma.reservation_details.create({
        data: {
          reservation_id: reservationRes.id,
          service_id: item.service_id,
          service_name: service.name,
          service_price: item.price,
          quantity,
          location_id,
        },
      });
    }

    const staffRotation=await handleStaffRotation(staff_id, location_id, final_price);

    if (reservationCustomer?.fcm_token && reservationCustomer?.is_verified) {
      try {
        await sendNotification(
          reservationCustomer.fcm_token,
          "Appointment Confirmed",
          `Hi ${customer_first_name}, your appointment has been successfully booked.`,
          {
            reservationId: reservationRes.id,
            reservationDate: date,
            startTime: time_slot.start_time,
          }
        );
      } catch (err) {
        console.error("Error sending notification to customer:", err);
      }
    }
    
    if (staff_id) {
      const staffUser = await prisma.user.findUnique({
        where: { id: staff_id },
        select: { fcm_token: true, first_name: true },
      });
    
      if (staffUser?.fcm_token) {
        try {
          await sendNotification(
            staffUser.fcm_token,
            "New Appointment Assigned",
            `You have a new appointment with ${customer_first_name}.`,
            {
              reservationId: reservationRes.id,
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

    
    return res.status(StatusCodes.CREATED).json({
      message: "reservation_created_successfully",
      reservation_id: reservationRes.id,
      staff_rotation:staffRotation
    });

  } catch (error) {
    console.error("Reservation Create Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
