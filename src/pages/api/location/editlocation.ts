import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";
import { handlePrismaError } from "../../../../lib/errorHandler";
import { checkConflicts, formatTime } from "../../../../utils/scheduleUtils";
import { hasInvalidTime } from "../../../../lib/checkTimeValidation";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    id,
    location_name,
    location_number,
    country,
    street,
    city,
    postcode,
    state,
    location_email,
    location_phone,
    location_timezone,
    location_24_hours,
    latitude,
    longitude,
    days,
  } = req.body;
  if (
    !id ||
    !location_name ||
    !location_number ||
    !country ||
    !street ||
    !city ||
    !postcode ||
    !location_email ||
    !location_phone ||
    !latitude ||
    !longitude
  ) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "missing_required_fields" });
  }
  if (!validateEmail(location_email)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "invalid_email_format" });
  }
  if (!validatePhoneNumber(location_phone)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "invalid_phone_number_format" });
  }

  if (hasInvalidTime(days)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "invalid_time_slot_date_format_found",
    });
  }

  const hasConflict = days?.some((day: any) => {
    const enabledTimeSlots = day?.timeSlots.filter(
      (slot: any) => slot.schedule_enabled
    );

    return checkConflicts(
      enabledTimeSlots?.map((slot: any) => ({
        schedule_from: formatTime(slot.schedule_from),
        schedule_to: formatTime(slot.schedule_to),
      }))
    );
  });
  const hasInvalidTimeRange = days?.some((day: any) =>
    day?.timeSlots?.some(
      (slot: any) =>
        slot?.schedule_enabled &&
        formatTime(slot?.schedule_from) >= formatTime(slot?.schedule_to)
    )
  );

  if (hasInvalidTimeRange) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error:
        "schedule_from_time_cannot_be_greater_than_or_equal_to_schedule_to_time",
    });
  }
  if (hasConflict) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error:
        "conflicting_or_duplicate_schedules_found_in_time_slots_within_the_same_day",
    });
  }
  try {
    const session = await validateAPI(
      req,
      res,
      true,
      ["Owner", "BackOfficeUser"],
      "POST"
    );
    if (!session) {
      return;
    }
    const updatedLocation = await prisma.$transaction(async (prisma:any) => {
      const existingLocationName = await prisma.location.findFirst({
        where: {
          location_name: location_name.trim().toLowerCase(),
          id: { not: id },
          deleted_status: false,
        },
      });
      if (existingLocationName) {
        return res.status(StatusCodes.CONFLICT).json({
          message: `entered_location_name_already_exists_within_the_company`,
        });
      }
      const existingLocationEmail = await prisma.location.findFirst({
        where: {
          location_email,
          id: { not: id },
          deleted_status: false,
        },
      });
      if (existingLocationEmail) {
        return res.status(StatusCodes.CONFLICT).json({
          message: `a_location_with_the_entered_email_already_exists_within_the_company`,
        });
      }
      await prisma.location_schedule.deleteMany({
        where: { location_id: id },
      });
      return prisma.location.update({
        where: { id: id },
        data: {
          location_name: location_name.trim().toLowerCase(),
          location_number,
          latitude,
          longitude,
          country,
          street,
          city,
          postcode,
          state,
          location_email: location_email.trim(),
          location_phone,
          location_timezone,
          location_24_hours: location_24_hours === "24-hours" ? true : false,
          location_schedule: {
            create: days.flatMap((day: { timeSlots: any[]; id: any }) =>
              day.timeSlots
                .filter(
                  (slot: { schedule_enabled: boolean }) => slot.schedule_enabled
                )
                .map(
                  (slot: { schedule_from: string; schedule_to: string }) => ({
                    schedule_day: day.id,
                    active_status: true,
                    schedule_from: formatTime(slot.schedule_from),
                    schedule_to: formatTime(slot.schedule_to),
                  })
                )
            ),
          },
        },
        include: {
          location_schedule: true,
        },
      });
    });

    return res
      .status(StatusCodes.OK)
      .json({ updatedLocation, message: "location_updated_successfully" });
  } catch (error) {
    console.log("error:", error)
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
// function formatTime(timeString: string) {
//   const date = new Date(`1970-01-01T${timeString}Z`);
//   return date.toISOString();
// }
function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function validatePhoneNumber(phone: string) {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
}
