import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { handlePrismaError } from "../../../../lib/errorHandler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        error: "method_not_allowed",
      });
    }

    const { user_id } = req.body;

    if (!user_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "unable_to_end_shift",
      });
    }

    const now = new Date();
    const formattedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase()
    const schedule = await prisma.user_schedule.findFirst({
      where: {
        user_id,
        schedule_day: {
          equals: day,
          mode: "insensitive"
        },
        schedule_enabled: true,
      },
    });

    if (!schedule) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "user_schedule_not_active_today",
      });
    }

    const existingClockRecord = await prisma.user_clock_in.findFirst({
      where: {
        user_id,
        date: formattedDate,
      },
    });

    if (existingClockRecord?.clock_out) {
      return res.status(StatusCodes.CONFLICT).json({
        error: "user_has_already_clocked_out_today",
      });
    }

    let clockRecord;

    if (existingClockRecord) {
      clockRecord = await prisma.user_clock_in.update({
        where: { id: existingClockRecord.id },
        data: { clock_out: now.toISOString() },
      });
    } else {
      clockRecord = await prisma.user_clock_in.create({
        data: {
          user_id,
          clock_in: now.toISOString(),
          clock_out: now.toISOString(),
          date: formattedDate,
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: { first_name: true, last_name: true },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "user_not_found",
      });
    }

    const message = `${user.first_name} ${user.last_name} has ended their shift.`;

    const logEntry = await prisma.activity_logs.create({
      data: {
        user_id,
        message,
        message_type: "info",
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "shift_closed_successfully",
      clockRecord,
      logEntry,
    });
  } catch (error: any) {
    console.error("Clock-out API error:", error);
    const prismaError = handlePrismaError(error);
    return res
      .status(prismaError.statusCode)
      .json({ message: prismaError.message });
  }
}
