import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let { location_id, fetchAll = false, search = "", rowsPerPage = 25, page = 1 } = req.body;

    let session = null;

    if (!location_id) {
      session = await validateAPI(
        req,
        res,
        true,
        ["Owner", "BackOfficeUser"],
        "POST"
      );

      if (!session) return;

      const { user } = session;
      location_id = user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_location_id",
      });
    }

    const safeRowsPerPage = Math.max(Number(rowsPerPage), 25);
    const safePage = Math.max(page, 1);

    const baseWhere: any = {
      location_id,
      deleted_status: false,
      name: {
        contains: search,
        mode: "insensitive",
      },
    };

    if (!session) {
      baseWhere.active_status = true;
    }

    const baseQuery: any = {
      where: baseWhere,
      orderBy: {
        sort_order: "asc",
      },
    };

    let services;

    if (fetchAll) {
      services = await prisma.services.findMany({...baseQuery, include: {
        categories: true,
      }});
    } else {
      services = await prisma.services.findMany({
        ...baseQuery,
        include: {
          categories: true,
        },
        skip: (safePage - 1) * safeRowsPerPage,
        take: safeRowsPerPage,
      });
    }

    const totalServices = await prisma.services.count({
      where: baseWhere,
    });

    return res.status(StatusCodes.OK).json({
      services,
      count:totalServices,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
