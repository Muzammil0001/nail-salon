import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";

type TimeSlot = {
  active_status: boolean;
  schedule_from: Date;
  schedule_to: Date;
};

type DaySchedule = {
  id: string;
  timeSlots: TimeSlot[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(
      req,
      res,
      true,
      ["Owner", "BackOfficeUser"],
      "POST"
    );

    if (!session) return;

    const { id } = req.body;

    if (!id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "location_id_is_required" });
    }

    const accessibleLocationIds: string[] | undefined =
      session.user.roles.includes("BackOfficeUser")
        ? session.user.accessrights?.controls?.locations?.map(
            (l: { location_id: string }) => l.location_id
          )
        : undefined;

    const location = await prisma.location.findFirst({
      where: {
        id,
        ...(accessibleLocationIds && { id: { in: accessibleLocationIds } }),
      },
      include: {
        location_schedule: true,
      },
    });

    if (!location || location.deleted_status) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "location_not_found" });
    }

    const days: DaySchedule[] = (location.location_schedule || []).reduce(
      (acc: DaySchedule[], schedule: any) => {
        const dayId: string = schedule.schedule_day;
        const timeSlot: TimeSlot = {
          active_status: schedule.active_status,
          schedule_from: schedule.schedule_from,
          schedule_to: schedule.schedule_to,
        };

        const existingDay = acc.find((d) => d.id === dayId);
        if (existingDay) {
          existingDay.timeSlots.push(timeSlot);
        } else {
          acc.push({
            id: dayId,
            timeSlots: [timeSlot],
          });
        }

        return acc;
      },
      []
    );

    const formattedLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      client_id: location.client_id,
      location_name: location.location_name,
      location_number: location.location_number,
      country: location.country,
      street: location.street,
      city: location.city,
      postcode: location.postcode,
      state: location.state,
      language_id: location.language_id || null,
      location_email: location.location_email,
      location_phone: location.location_phone,
      location_timezone: location.location_timezone,
      location_24_hours: location.location_24_hours ? "24-hours" : "12-hours",
      days,
    };

    return res.status(StatusCodes.OK).json(formattedLocation);
  } catch (error) {
    console.error("Error in location fetch handler:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
