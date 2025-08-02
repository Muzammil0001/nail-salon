import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
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

    const location_id = session.user.selected_location_id;
    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_invalid_location_id",
      });
    }

    const fetchAll = req.body.fetchAll ?? false;
    const searchQuery = req.body.search || "";
    const rowsPerPage = parseInt(req.body.rowsPerPage, 10) || 10;
    const currentPage = parseInt(req.body.page, 10) || 0;

    const baseFilter = {
      deleted_status: false,
      location_id,
    };

    let customers: any;
    let count = 0;

    if (fetchAll) {
      customers = await prisma.customers.findMany({
        where: baseFilter,
      });
    } else {
      count = await prisma.customers.count({
        where: {
          ...baseFilter,
          OR: [
            {
              firstname: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              lastname: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
          ],
        },
        orderBy: {
          created_at: "desc",
        },
      });

      customers = await prisma.customers.findMany({
        where: {
          ...baseFilter,
          OR: [
            {
              firstname: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              lastname: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
          ],
        },
        orderBy: {
          created_at: "desc",
        },
        take: rowsPerPage,
        skip: currentPage * rowsPerPage,
      });
    }

    return res.status(StatusCodes.OK).json({
      message: "customers_fetched_successfully",
      customers,
      count,
    });
  } catch (error) {
    console.error("Error during the API request:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
