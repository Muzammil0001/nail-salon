import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";

type TimeSlot = {
  active_status: boolean;
  schedule_from: Date;
  schedule_to: Date;
};

type DaySchedule = {
  id: number;
  timeSlots: TimeSlot[];
};

export default async function fetchAllLocations(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        message: "method_not_allowed",
      });
    }

    const { search = "" } = req.body;

    const whereCondition: any = {
      deleted_status: false,
    };

    if (search) {
      whereCondition.location_name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const locations = await prisma.location.findMany({
      where: whereCondition,
      include: {
        location_schedule: true,
      },
      orderBy: { created_at: "desc" },
    });

    const transformedLocations = locations.map((loc) => {
      const days: DaySchedule[] = (loc.location_schedule || []).reduce(
        (acc: DaySchedule[], schedule: any) => {
          const dayId: number = schedule.schedule_day;
          const timeSlot: TimeSlot = {
            active_status: schedule.schedule_enabled,
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

      return {
        ...loc,
        location_schedule:days,
      };
    });

    return res.status(StatusCodes.OK).json({ locations: transformedLocations });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
