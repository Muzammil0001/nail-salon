import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, true, [], "POST");
    if (session) {
      const { rowsPerPage = 25, page = 0, search = "", filters = {} } = req.body;

      const whereClause: any = {
        deleted_status: false,
        location_id: session.user.selected_location_id,
      };

      // Add search functionality
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { card_code: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      // Add filters
      if (filters.status !== undefined && filters.status !== null) {
        whereClause.active_status = filters.status;
      }

      if (filters.currency && filters.currency.length > 0) {
        whereClause.currency = { in: filters.currency };
      }

      // Get total count
      const count = await prisma.gift_card.count({
        where: whereClause,
      });

      // Get gift cards with pagination
      const giftCards = await prisma.gift_card.findMany({
        where: whereClause,
        include: {
          location: {
            select: {
              location_name: true,
            },
          },
          created_by_user: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        skip: page * rowsPerPage,
        take: rowsPerPage,
      });

      res.status(StatusCodes.OK).json({
        success: true,
        giftCards,
        count,
      });
    }
  } catch (error) {
    console.error("Error fetching gift cards:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal_server_error",
    });
  }
} 