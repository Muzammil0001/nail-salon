import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      message: "method_not_allowed",
    });
  }

  try {
    const session = await validateAPI(
      req,
      res,
      true,
      ["Owner", "BackOfficeUser"],
      "POST"
    );

    const location_id = session?.user?.selected_location_id;

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "location_id_required",
      });
    }

    const {
      earn_amount,
      earn_points,
      redeem_points,
      redeem_amount,
      max_redeem_pct,
      expires_in_days,
    } = req.body;

    if (
      earn_amount === undefined ||
      earn_points === undefined ||
      redeem_points === undefined ||
      redeem_amount === undefined ||
      max_redeem_pct === undefined
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_required_fields",
      });
    }

    const result = await prisma.loyalty.upsert({
      where: { location_id },
      update: {
        earn_amount,
        earn_points,
        redeem_points,
        redeem_amount,
        max_redeem_pct,
        expires_in_days,
      },
      create: {
        location_id,
        earn_amount,
        earn_points,
        redeem_points,
        redeem_amount,
        max_redeem_pct,
        expires_in_days,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "loyalty_saved_successfully",
      data: result,
    });
  } catch (error) {
    console.error("Loyalty Upsert Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
