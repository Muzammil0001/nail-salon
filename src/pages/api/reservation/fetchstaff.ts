import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { location_id, date } = req.body;

    if (!location_id || !date) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "location_id_and_date_are_required",
      });
    }

    const inputDate = new Date(date);
    const dayOfWeek = inputDate.toLocaleString("en-US", { weekday: "long" }); 

    const staffUsers = await prisma.user.findMany({
      where: {
        deleted_status: false,
        location_id: location_id,
        active_status:true,
        user_to_role: {
          some: {
            role: {
              name: "Staff",
            },
          },
        },
        user_schedule: {
          some: {
            schedule_day: {
              equals: dayOfWeek,
              mode: "insensitive", 
            },
            schedule_enabled: true,
          }
        }        
      },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        active_status:true,
        user_schedule: {
          where: {
            schedule_day: {
              equals: dayOfWeek,
              mode: "insensitive",
            },
            schedule_enabled: true,
          },        
          select: {
            schedule_day: true,
            schedule_from: true,
            schedule_to: true,
          },
        },
      },
    });

    return res.status(StatusCodes.OK).json({ users: staffUsers });
  } catch (error) {
    console.error("Error fetching available staff:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
