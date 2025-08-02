import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      message: "method_not_allowed",
    });
  }

  try {
    let {
      total_price,
      redeem_points,
      discount_per_point,
      max_allowed_discount,
    } = req.body;

    total_price = Number(total_price);
    redeem_points = Number(redeem_points);
    discount_per_point = Number(discount_per_point);
    max_allowed_discount = Number(max_allowed_discount);

    if (
      isNaN(total_price) ||
      isNaN(redeem_points) ||
      isNaN(discount_per_point) ||
      isNaN(max_allowed_discount)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          "missing_required_fields",
      });
    }

    const attempted_discount = redeem_points * discount_per_point;

    const maxAllowedDiscountAmount = (max_allowed_discount * total_price) / 100;

    const allowed_points = Math.floor(maxAllowedDiscountAmount / discount_per_point);

    if (attempted_discount > maxAllowedDiscountAmount) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "exceeds_max_allowed_discount",
        max_allowed_discount: maxAllowedDiscountAmount,
        attempted_discount,
        allowed_points,
      });
    }

    const final_price = parseFloat((total_price - attempted_discount).toFixed(2));

    return res.status(StatusCodes.OK).json({
      allowed_points,
      discount: attempted_discount,
      final_price,
    });
  } catch (error) {
    console.error("Discount Calculation Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
