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
    const { user_id, location_id, total_price } = req.body;

    if (!user_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "user_id_is_required",
      });
    }

    let locationId = location_id;

    if (!locationId) {
      const session = await validateAPI(req, res, true, [ "Owner", "BackOfficeUser"], "POST");
      if (!session?.user?.selected_location_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "location_id_is_required",
        });
      }
      locationId = session.user.selected_location_id;
    }

    const customer = await prisma.reservation_customer.findFirst({
      where: {
        id: user_id,
        deleted_status: false,
        active_status: true,
      },
    });

    if (!customer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "customer_not_found",
      });
    }

    const loyalty = await prisma.loyalty.findFirst({
      where: {
        location_id: locationId,
        deleted_status: false,
      },
    });

    if (!loyalty) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "loyalty_configuration_not_found",
      });
    }

    const now = new Date();

    const history = await prisma.loyalty_history.findMany({
      where: {
        user_id,
        location_id: locationId,
      },
    });

    const totalEarned = history
      .filter(
        (entry) =>
          entry.type === "EARNED" && (!entry.expires_at || entry.expires_at > now)
      )
      .reduce((sum, entry) => sum + entry.points, 0);

    const totalRedeemed = history
      .filter((entry) => entry.type === "REDEEMED")
      .reduce((sum, entry) => sum + entry.points, 0);

    const availablePoints = Math.max(totalEarned - totalRedeemed, 0);

    const discountPerPoint =
      loyalty.redeem_points > 0
        ? loyalty.redeem_amount / loyalty.redeem_points
        : 0;

        let maxAllowedPoints = 0;

        if (discountPerPoint > 0 && total_price && !isNaN(total_price)) {
          const maxAllowedDiscount = (loyalty.max_redeem_pct * total_price) / 100;
          maxAllowedPoints = Math.floor(maxAllowedDiscount / discountPerPoint);
        }

    await prisma.user_loyalty.upsert({
      where: { user_id },
      update: { points: availablePoints },
      create: {
        user_id,
        points: availablePoints,
      },
    });

    return res.status(StatusCodes.OK).json({
      availablePoints,
      discountPerPoint,
      max_redeem_pct: loyalty.max_redeem_pct,
      maxAllowedPoints,
    });

  } catch (error) {
    console.error("Loyalty Points Fetch Error:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
