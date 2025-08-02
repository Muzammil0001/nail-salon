import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { handlePrismaError } from "../../../../lib/errorHandler";
import validateAPI from "../../../../lib/valildateApi";
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
    if (!session) {
      return;
    }
    const fetchAll = req.body.fetchAll ?? false;
    const searchQuery = req.body.search || "";
    const rowsPerPage = parseInt(req.body.rowsPerPage, 10) || 10;
    const currentPage = parseInt(req.body.page, 10) || 0;
    const location_id = req.body.location_id;
    let devices;
    let count = 0;
    const baseFilter = {
      deleted_status: false,
      // ...(location_id && { location_id: location_id }),
      location_id,
    };
    if (fetchAll) {
      devices = await prisma.device.findMany({
        where: baseFilter,
        include: {
          location: true,
        },
        orderBy: {
          device_name: "asc",
        },
      });
    } else {
      count = await prisma.device.count({
        where: {
          ...baseFilter,
          device_name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
      });
      devices = await prisma.device.findMany({
        where: {
          ...baseFilter,
          device_name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        include: {
          location: true,
        },
        orderBy: {
          device_name: "asc",
        },
        take: rowsPerPage,
        skip: currentPage * rowsPerPage,
      });
    }
    if (!devices) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "device_not_found" });
    }
    return res.status(StatusCodes.OK).json({
      message: "devices_fetched_successfully",
      data: devices,
      count,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
