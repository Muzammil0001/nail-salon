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

    const safePage = Math.max(page, 1);
    const safeRowsPerPage = Math.max(Number(rowsPerPage), 25);

    const whereClause: any = {
      deleted_status: false,
      location_id,
    };

    if (!session) {
      whereClause.active_status = true;
    }

    if (search) {
      whereClause.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (fetchAll) {
      const allCategories = await prisma.categories.findMany({
        where: whereClause,
        orderBy: {
          sort_order: "asc",
        },
      });

      return res.status(StatusCodes.OK).json({
        message: "categories_fetched_successfully",
        data: allCategories,
        total: allCategories.length,
      });
    }

    const total = await prisma.categories.count({ where: whereClause });

    const categories = await prisma.categories.findMany({
      where: whereClause,
      skip: (safePage - 1) * safeRowsPerPage,
      take: safeRowsPerPage,
      orderBy: {
        sort_order: "asc",
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "categories_fetched_successfully",
      data: categories,
      count: total,
      currentPage: page,
      rowsPerPage,
    });

  } catch (error) {
    console.error("Fetch Categories Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
