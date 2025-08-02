import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import moment from "moment";
import { combineDateWithTime } from "../../../../lib/combineDateWithTime";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      success: false,
      message: "method_not_allowed",
    });
  }

  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "user_id_is_required",
      });
    }

    const [date, time] = moment().format("YYYY-MM-DD HH:mm:ss").split(" ");

    const localDateTime = combineDateWithTime(date, time);

    if (isNaN(localDateTime.getTime())) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "invalid_date_time_format",
      });
    }

    const formattedDate = new Date(localDateTime);
    formattedDate.setHours(0, 0, 0, 0);

    const todayWeekday = localDateTime.toLocaleDateString("en-US", {
      weekday: "long",
    }).toLowerCase();

    const schedule = await prisma.user_schedule.findFirst({
      where: {
        user_id,
        schedule_enabled: true,
        schedule_day: {
          equals: todayWeekday,
          mode: "insensitive",
        },
      },
    });

    if (!schedule) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "schedule_off_today_or_not_enabled",
      });
    }

    const existingClockIn = await prisma.user_clock_in.findFirst({
      where: {
        user_id,
        date: formattedDate,
      },
    });

    if (existingClockIn) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "user_has_already_clocked_in_today",
      });
    }

    const newClockIn = await prisma.user_clock_in.create({
      data: {
        user_id,
        clock_in: localDateTime,
        date: formattedDate,
      },
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "clock_in_recorded_successfully",
      data: newClockIn,
    });
  } catch (error: any) {
    console.error("Clock-in error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal_server_error",
      error: error.message,
    });
  }
}
