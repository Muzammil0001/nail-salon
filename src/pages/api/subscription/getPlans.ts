import type { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin"], "POST");
    if (session) {
      let Subscriptions = await prisma.subscriptions.findMany({
        where: {
          deleted_status: false,
          active_status: true,
        },
        include: {
          subscription_feature: {
            include: {
              feature: true,
            },
          },
        },
        orderBy: {
          price: "asc",
        },
      });
      let SubscriptionPlans: any[] = [];
      await Subscriptions.forEach((x: any) => {
        const formattedPrice = parseFloat(x.price).toFixed(2);
        SubscriptionPlans.push({
          ...x,
          price: formattedPrice,
          month_link: `https://admin.${
            process.env.NEXT_PUBLIC_URL
          }/checkout?body=${Buffer.from(
            `billingModel=M&subscriptionId=${x.id}&partner_id=1&affiliate=null`,
            "binary"
          ).toString("base64")}`,
          year_link: `https://admin.${
            process.env.NEXT_PUBLIC_URL
          }/checkout?body=${Buffer.from(
            `billingModel=Y&subscriptionId=${x.id}&partner_id=1&affiliate=null`,
            "binary"
          ).toString("base64")}`,
        });
      });
      res.status(StatusCodes.OK);
      res.json({
        Subscriptions: SubscriptionPlans,
      });
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
