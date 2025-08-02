import prisma from "./prisma";

interface AwardPointsProps {
  user_id: string; 
  location_id: string;
  reservation_id: string;
  final_price: number;
  payment_status: "SUCCESS" | "FAILED" | "PENDING" | "REFUNDED";
}

export const awardLoyaltyPoints = async ({
  user_id,
  location_id,
  reservation_id,
  final_price,
  payment_status,
}: AwardPointsProps) => {
  try {
    if (payment_status !== "SUCCESS" || final_price <= 0) return;

    const loyalty = await prisma.loyalty.findFirst({
      where: { location_id, deleted_status: false },
    });

    if (!loyalty || loyalty.earn_amount <= 0 || loyalty.earn_points <= 0) return;

    const earnedPoints =
      (final_price / loyalty.earn_amount) * loyalty.earn_points;

    await prisma.loyalty_history.create({
      data: {
        user_id, 
        reservation_id,
        type: "EARNED",
        points: earnedPoints,
        amount: final_price,
        location_id,
        expires_at: loyalty.expires_in_days
          ? new Date(Date.now() + loyalty.expires_in_days * 24 * 60 * 60 * 1000)
          : null,
        remaining_points: earnedPoints,
      },
    });

   const response= await prisma.user_loyalty.upsert({
      where: { user_id },
      update: {
        points: {
          increment: earnedPoints,
        },
      },
      create: {
        user_id,
        points: earnedPoints,
      },
    });

  } catch (error) {
    console.error("Failed to award loyalty points:", error);
  }
};
