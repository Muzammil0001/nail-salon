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
      const { id } = req.body;

      // Validate required fields
      if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "gift_card_id_required",
        });
      }

      // Get gift card with transactions
      const giftCard = await prisma.gift_card.findFirst({
        where: {
          id,
          location_id: session.user.selected_location_id as string,
          deleted_status: false,
        },
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
          gift_card_transactions: {
            orderBy: {
              created_at: "desc",
            },
            include: {
              created_by_user: {
                select: {
                  first_name: true,
                  last_name: true,
                },
              },
              reservations: {
                select: {
                  reservation_number: true,
                  reservation_date: true,
                },
              },
            },
          },
        },
      });

      if (!giftCard) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "gift_card_not_found",
        });
      }

      res.status(StatusCodes.OK).json({
        success: true,
        giftCard,
      });
    }
  } catch (error) {
    console.error("Error fetching gift card:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal_server_error",
    });
  }
} 