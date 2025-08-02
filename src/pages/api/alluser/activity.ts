import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { handlePrismaError } from "../../../../lib/errorHandler";

const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res
        .status(StatusCodes.METHOD_NOT_ALLOWED)
        .json({ error: "method_not_allowed" });
    }

    const {
      userId,
      fetchAll = false,
      search = "",
      rowsPerPage = 25,
      page = 0,
    } = req.body;

    if (!userId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "user_id_required" });
    }

    const baseFilter = {
      user_id: String(userId),
    };

    let activities;
    let count = 0;

    if (fetchAll) {
      activities = await prisma.activity_logs.findMany({
        where: baseFilter,
        select: {
          id: true,
          message: true,
          created_at: true,
          user_agent: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });
    } else {
      count = await prisma.activity_logs.count({
        where: {
          ...baseFilter,
          message: {
            contains: search,
            mode: "insensitive",
          },
        },
      });

      activities = await prisma.activity_logs.findMany({
        where: {
          ...baseFilter,
          message: {
            contains: search,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          message: true,
          created_at: true,
          user_agent: true,
        },
        orderBy: {
          created_at: "desc",
        },
        take: rowsPerPage,
        skip: page * rowsPerPage,
      });
    }

    const formattedActivities = activities.map((activity:any) => ({
      id: activity.id,
      message: activity.message,
      created_at: formatDate(activity.created_at),
      user_agent: activity.user_agent,
    }));

    return res.status(StatusCodes.OK).json({
      message: "activity_logs_fetched_successfully",
      activities: formattedActivities,
      count,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
