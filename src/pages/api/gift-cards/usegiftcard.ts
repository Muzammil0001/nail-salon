import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      success: false,
      message: "method_not_allowed",
    });
  }

  try {
    const session = await validateAPI(req, res, true, [], "POST");

    if (!session) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "unauthorized",
      });
    }

    const { gift_card_id, amount_used, reservation_id } = req.body;

    if (!gift_card_id || !amount_used || amount_used <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "gift_card_id_and_amount_required",
      });
    }

    const giftCard = await prisma.gift_card.findFirst({
      where: {
        id: gift_card_id,
        location_id: session.user.selected_location_id as string,
        deleted_status: false,
      },
    });

    if (!giftCard) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "gift_card_not_found",
      });
    }

    if (!giftCard.active_status) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "gift_card_inactive",
      });
    }

    if (giftCard.expiry_date && new Date() > giftCard.expiry_date) {
      await prisma.gift_card.update({
        where: { id: gift_card_id },
        data: { active_status: false },
      });

      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "gift_card_expired",
      });
    }

    if (giftCard.times_used >= giftCard.number_of_times) {
      await prisma.gift_card.update({
        where: { id: gift_card_id },
        data: { active_status: false },
      });

      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "gift_card_usage_limit_reached",
      });
    }

    if (giftCard.balance < amount_used) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "insufficient_balance",
      });
    }

    const newBalance = giftCard.balance - amount_used;
    const newTimesUsed = giftCard.times_used + 1;
    const shouldDisable = newTimesUsed >= giftCard.number_of_times;

    const updatedGiftCard = await prisma.gift_card.update({
      where: { id: gift_card_id },
      data: {
        balance: newBalance,
        times_used: newTimesUsed,
        active_status: !shouldDisable,
      },
    });

    await prisma.gift_card_transaction.create({
      data: {
        gift_card_id: gift_card_id,
        transaction_type: "REDEMPTION",
        amount: amount_used,
        balance_before: giftCard.balance,
        balance_after: newBalance,
        times_used_before: giftCard.times_used,
        times_used_after: newTimesUsed,
        reservation_id: reservation_id || null,
        created_by: session.user.id as string,
      },
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "gift_card_used_successfully",
      data: {
        gift_card: updatedGiftCard,
        remaining_uses: giftCard.number_of_times - newTimesUsed,
        is_disabled: shouldDisable,
      },
    });
  } catch (error) {
    console.error("Error using gift card:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal_server_error",
    });
  }
} 