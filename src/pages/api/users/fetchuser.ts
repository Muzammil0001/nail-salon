import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  type TimeSlot = {
    active_status: boolean;
    schedule_from: Date;
    schedule_to: Date;
  };

  type DaySchedule = {
    id: number;
    timeSlots: TimeSlot[];
  };

  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin", "Owner","BackOfficeUser"], "POST");
    if (session) {
      const user: any = await prisma.user.findUnique({
        where: {
          id: req.body.id, deleted_status: false
        },
        include: {
          user_to_role: {
            include: {
              role: true,
            },
          },
          user_schedule: true,
          accessrights: true,
        },
      });

      if (!user) {
        res.status(StatusCodes.NOT_FOUND);
        return res.json({ message: "user_not_found" });
      }

      
      const days: DaySchedule[] = (user.user_schedule || []).reduce(
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

      user.roles = user.user_to_role.map(
        (role: Record<string, any>) => role.role.id
      );

      if (user.accessrights) {
        user.accessrights = user.accessrights.controls;
      }

      user.password = "";
      user.days = days;

      res.status(StatusCodes.OK);
      res.json(user);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
