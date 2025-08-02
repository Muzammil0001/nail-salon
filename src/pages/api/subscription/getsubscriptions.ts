import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, false, [], "POST");
    if (session) {
      let plans: any = await prisma.subscriptions.findMany({
        where: {
          deleted_status: false,
        },
        include: {
          subscription_feature: {
            include: {
              feature: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });
      for (const plan of plans) {
        plan.subscription_feature = plan.subscription_feature.map(
          (f: any) => f.feature_id
        );
      }
      res.status(StatusCodes.OK);
      res.json(plans);
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
