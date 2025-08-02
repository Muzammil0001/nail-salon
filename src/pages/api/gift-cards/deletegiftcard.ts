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

      // Soft delete gift card
      await prisma.gift_card.update({
        where: { id },
        data: {
          deleted_status: true,
          active_status: false,
        },
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: "gift_card_deleted_successfully",
      });
    }
  } catch (error) {
    console.error("Error deleting gift card:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal_server_error",
    });
  }
} 