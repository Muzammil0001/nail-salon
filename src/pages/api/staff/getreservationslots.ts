import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let { staff_id, date, service_ids, location_id } = req.body;

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

    if (!staff_id || !date || !Array.isArray(service_ids) || service_ids.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_required_fields",
      });
    }

    const inputDate = new Date(date);
    const dayOfWeek = inputDate.toLocaleString("en-US", { weekday: "long" });

    const staff = await prisma.user.findFirst({
      where: {
        id: staff_id,
        location_id,
        deleted_status: false,
      },
    });

    if (!staff) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Staff not found at given location",
      });
    }

    const locationSchedule = await prisma.location_schedule.findFirst({
      where: {
        location_id,
        OR: [
          { schedule_day: dayOfWeek.toLowerCase() },
          { schedule_day: dayOfWeek }
        ],
        active_status: true,
      },
    });

    if (!locationSchedule) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: `Location is off on ${dayOfWeek}`,
      });
    }

    const userSchedule = await prisma.user_schedule.findFirst({
      where: {
        user_id: staff_id,
        OR: [
          { schedule_day: dayOfWeek.toLowerCase() },
          { schedule_day: dayOfWeek }
        ],
        schedule_enabled: true,
      },
    });

    if (!userSchedule) {
      return res.status(StatusCodes.OK).json({
        availableSlots: [],
        message: `Staff is unavailable on ${dayOfWeek} `,
      });
    }

    const services = await prisma.services.findMany({
      where: {
        id: { in: service_ids },
        deleted_status: false,
        active_status: true,
        location_id,
      },
      select: {
        duration_minutes: true,
      },
    });

    const totalDuration = services.reduce((sum, s) => sum + s.duration_minutes, 0);

    if (totalDuration <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Invalid service durations or no active services found",
      });
    }

    const scheduleStart = new Date(inputDate);
    scheduleStart.setUTCHours(
      userSchedule.schedule_from.getUTCHours(),
      userSchedule.schedule_from.getUTCMinutes(),
      0,
      0
    );

    const scheduleEnd = new Date(inputDate);
    scheduleEnd.setUTCHours(
      userSchedule.schedule_to.getUTCHours(),
      userSchedule.schedule_to.getUTCMinutes(),
      0,
      0
    );

    const existingReservations = await prisma.reservations.findMany({
      where: {
        staff_id,
        location_id,
        deleted_status: false,
        schedule_start_time: {
          gte: scheduleStart,
          lt: scheduleEnd,
        },
      },
      select: {
        schedule_start_time: true,
        schedule_end_time: true,
      },
    });

    const availableSlots: string[] = [];
    let current = new Date(scheduleStart);

    while (current.getTime() + totalDuration * 60000 <= scheduleEnd.getTime()) {
      const slotEnd = new Date(current.getTime() + totalDuration * 60000);

      const overlaps = existingReservations.some(res => {
        const resEnd = res.schedule_end_time ?? new Date(res.schedule_start_time.getTime() + totalDuration * 60000);
        return (
          (current >= res.schedule_start_time && current < resEnd) ||
          (slotEnd > res.schedule_start_time && slotEnd <= resEnd) ||
          (current <= res.schedule_start_time && slotEnd >= resEnd)
        );
      });

      if (!overlaps) {
        availableSlots.push(current.toISOString());
      }

      current = new Date(current.getTime() + totalDuration * 60000);
    }

    return res.status(StatusCodes.OK).json({ availableSlots });
  } catch (error) {
    console.error("Error generating available slots:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
