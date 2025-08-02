import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../../lib/prisma";
import authMiddleware from "../../../../../lib/authMiddleware";

const fetchActivityLogs = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
  }

  const user = await authMiddleware(req, res);
  if (!user) return;

  let {
    fetchAll = false,
    search = "",
    rowsPerPage = 25,
    page = 1,
  } = req.body;

  rowsPerPage = Math.max(1, Number(rowsPerPage) || 25);
  page = Math.max(1, Number(page) || 1);

  try {
    const whereCondition: any = {
        customer_id: user.id,
      };
      
      if (search) {
        whereCondition.OR = [
          {
            action: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            details: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];
      }
      
    const logs = await prisma.customer_activity_logs.findMany({
      where: whereCondition,
      orderBy: { created_at: "desc" },
      ...(fetchAll
        ? {}
        : {
            skip: (page - 1) * rowsPerPage,
            take: rowsPerPage,
          }),
    });

    const totalCount = await prisma.customer_activity_logs.count({
      where: whereCondition,
    });

    return res.status(StatusCodes.OK).json({
      message: "activity_logs_fetched_successfully",
      logs,
      total_count: totalCount,
      page,
      rows_per_page: rowsPerPage,
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
};

export default fetchActivityLogs;
