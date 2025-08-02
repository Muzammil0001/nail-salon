import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(StatusCodes.METHOD_NOT_ALLOWED)
      .json({ success: false, message: "method_not_allowed" });
  }

  try {
    const { total_amount, gift_code } = req.body;
    console.log(req.body);

    if (!total_amount || total_amount <= 0 || !gift_code) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "total_amount_and_gift_code_required",
      });
    }

    const giftCard = await prisma.gift_card.findFirst({
      where: {
        card_code: gift_code,
        active_status: true,
        deleted_status: false,
        OR: [
          { expiry_date: null },
          { expiry_date: { gte: new Date() } },
        ],
      },
    });

    if (!giftCard) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "gift_card_invalid_or_expired",
      });
    }

    if (giftCard.times_used >= giftCard.number_of_times) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "gift_card_usage_limit_reached",
      });
    }

    if (giftCard.amount <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "gift_card_balance_empty",
      });
    }

  
    const total = Number(total_amount);
    const giftAmount = Number(giftCard.amount);
    let discount = 0;

    if (giftCard.is_percentage) {
      discount = (total * giftAmount) / 100;
      discount = Math.min(discount, total); 
    } else {
      discount = Math.min(giftAmount, total); 
    }

    const finalAmount = total - discount;

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "gift_card_applied",
      original_amount: total,
      discount_applied: discount,
      final_amount: finalAmount,
      gift_card_details: {
        id: giftCard.id,
        name: giftCard.name,
        code: giftCard.card_code,
        is_percentage: giftCard.is_percentage,
        amount: giftCard.amount,
      },
    });
  } catch (error) {
    console.error("Error applying gift card:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal_server_error",
    });
  }
}
