import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../../lib/prisma";
import validateAPI from "../../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
    }

    let { location_id, page = 0, rowsPerPage = 25, fetchAll = false } = req.body;
    let session = null;

    if (!location_id) {
      session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    if (!location_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "missing_or_invalid_location" });
    }

    const whereClause = { location_id };

    const [activityLogs, totalCount] = await Promise.all([
      prisma.activity_logs.findMany({
        where: whereClause,
        orderBy: {
          created_at: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        ...(fetchAll
          ? {}
          : {
              skip: page * rowsPerPage,
              take: rowsPerPage,
            }),
      }),

      prisma.activity_logs.count({
        where: whereClause,
      }),
    ]);

    res.status(StatusCodes.OK).json({
      logs:activityLogs,
      totalCount,
      page: fetchAll ? 0 : page,
      rowsPerPage: fetchAll ? totalCount : rowsPerPage,
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
