import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";

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

    const fetchAll = req.body.fetchAll ?? false;
    const rowsPerPage = parseInt(req.body.rowsPerPage, 10) || 10;
    const currentPage = parseInt(req.body.page, 10) || 0;

    const baseFilter = {
      deleted_status: false,
    };

    let appVersions;
    let count = 0;

    if (fetchAll) {
      appVersions = await prisma.app_version.findMany({
        where: baseFilter,
        include: {
          app_name: true,
        },
        orderBy: {
          app_version_datetime: "desc",
        },
      });
    } else {
      count = await prisma.app_version.count({
        where: baseFilter,
      });

      appVersions = await prisma.app_version.findMany({
        where: baseFilter,
        include: {
          app_name: true,
        },
        orderBy: {
          app_version_datetime: "desc",
        },
        take: rowsPerPage,
        skip: currentPage * rowsPerPage,
      });
    }

    return res.status(StatusCodes.OK).json({
      message: "app_versions_fetched_successfully",
      appVersions,
      count,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
