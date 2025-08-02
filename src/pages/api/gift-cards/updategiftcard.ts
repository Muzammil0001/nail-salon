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
      const {
        id,
        name,
        description,
        amount,
        number_of_times,
        is_percentage,
        gift_code,
        expiry_date,
        active_status,
      } = req.body;

      // Validate required fields
      if (!id || !name || !amount || amount <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "id_name_and_amount_required",
        });
      }

      // Validate percentage
      if (is_percentage && amount > 100) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "percentage_cannot_exceed_100",
        });
      }

      if (!gift_code || !/^[A-Z0-9]{4}$/.test(gift_code)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "invalid_gift_code",
        });
      }

      // Check if gift card exists and belongs to the location
      const existingGiftCard = await prisma.gift_card.findFirst({
        where: {
          id,
          location_id: session.user.selected_location_id as string,
          deleted_status: false,
        },
      });

      if (!existingGiftCard) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "gift_card_not_found",
        });
      }

      const updatedGiftCard = await prisma.gift_card.update({
        where: { id },
        data: {
          name,
          description,
          amount,
          number_of_times: number_of_times || existingGiftCard.number_of_times,
          is_percentage: is_percentage !== undefined ? is_percentage : existingGiftCard.is_percentage,
          card_code: gift_code ? gift_code : existingGiftCard.card_code,
          expiry_date: expiry_date ? new Date(expiry_date) : null,
          active_status: active_status !== undefined ? active_status : existingGiftCard.active_status,
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
        },
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: "gift_card_updated_successfully",
        giftCard: updatedGiftCard,
      });
    }
  } catch (error) {
    console.error("Error updating gift card:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal_server_error",
    });
  }
} 