import prisma from "./prisma";

export const handlePointsRedemption = async ({
  user_id,
  location_id,
  reservation_id,
  redeemPoints,
}: {
  user_id: string;
  location_id: string;
  reservation_id: string;
  redeemPoints: number;
}) => {
  if (!redeemPoints || redeemPoints <= 0) return;

  const loyaltyConfig = await prisma.loyalty.findUnique({
    where: { location_id },
  });

  if (!loyaltyConfig) {
    throw { status: 400, message: "Loyalty configuration not found" };
  }

  const userLoyalty = await prisma.user_loyalty.findUnique({
    where: { user_id },
  });

  if (!userLoyalty || userLoyalty.points < redeemPoints) {
    throw { status: 400, message: "Not enough loyalty points" };
  }

  const discountPerPoint =
    loyaltyConfig.redeem_amount / loyaltyConfig.redeem_points;

  const now = new Date();

  const earnedEntries = await prisma.loyalty_history.findMany({
    where: {
      user_id,
      location_id,
      type: "EARNED",
      OR: [
        { expires_at: null },
        { expires_at: { gt: now } },
      ],
      remaining_points: {
        gt: 0,
      },
    },
    orderBy: {
      expires_at: "asc",
    },
  });

  let remainingToRedeem = redeemPoints;

  for (const earned of earnedEntries) {
    if (remainingToRedeem <= 0) break;

    const available = earned.remaining_points || 0;
    const deduct = Math.min(available, remainingToRedeem);

    await prisma.loyalty_history.create({
      data: {
        user_id,
        location_id,
        reservation_id,
        type: "REDEEMED",
        points: deduct,
        amount: parseFloat((deduct * discountPerPoint).toFixed(2)),
        earned_from_id: earned.id,
      },
    });

    await prisma.loyalty_history.update({
      where: { id: earned.id },
      data: {
        remaining_points: available - deduct,
      },
    });

    remainingToRedeem -= deduct;
  }

  await prisma.user_loyalty.update({
    where: { user_id },
    data: {
      points: {
        decrement: redeemPoints,
      },
    },
  });
};
