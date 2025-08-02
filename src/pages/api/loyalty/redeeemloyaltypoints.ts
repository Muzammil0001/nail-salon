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
    const { user_id, location_id, reservation_id, points_to_redeem } = req.body;

    if (!user_id || !points_to_redeem || points_to_redeem <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "user_id_and_valid_points_required",
      });
    }

    let locationId = location_id;

    if (!locationId) {
      const session = await validateAPI(req, res, true, ["Customer", "Owner", "BackOfficeUser"], "POST");
      if (!session?.user?.selected_location_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "location_id_is_required",
        });
      }
      locationId = session.user.selected_location_id;
    }

    const loyalty = await prisma.loyalty.findFirst({
      where: { location_id: locationId, deleted_status: false },
    });

    if (!loyalty) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "loyalty_configuration_not_found",
      });
    }

    const now = new Date();
    let remainingToRedeem = points_to_redeem;
    let totalRedeemed = 0;

    const earnHistory = await prisma.loyalty_history.findMany({
      where: {
        user_id,
        location_id: locationId,
        type: "EARNED",
        OR: [
          { expires_at: null },
          { expires_at: { gt: now } },
        ],
      },
      orderBy: { created_at: "asc" },
    });

    for (const earn of earnHistory) {
      if (remainingToRedeem <= 0) break;

      const available = earn.remaining_points ?? earn.points;
      if (available <= 0) continue;

      const redeemNow = Math.min(remainingToRedeem, available);

      await prisma.loyalty_history.create({
        data: {
          user_id, 
          location_id: locationId,
          reservation_id: reservation_id || null,
          type: "REDEEMED",
          points: redeemNow,
          amount: redeemNow * (loyalty.redeem_amount / loyalty.redeem_points),
          earned_from_id: earn.id,
        },
      });

      await prisma.loyalty_history.update({
        where: { id: earn.id },
        data: {
          remaining_points: available - redeemNow,
        },
      });

      totalRedeemed += redeemNow;
      remainingToRedeem -= redeemNow;
    }

    if (totalRedeemed < points_to_redeem) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "not_enough_points_available",
        redeemed: totalRedeemed,
      });
    }

    return res.status(StatusCodes.OK).json({
      message: "points_redeemed_successfully",
      redeemed: totalRedeemed,
    });
  } catch (error) {
    console.error("Redeem Points Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
