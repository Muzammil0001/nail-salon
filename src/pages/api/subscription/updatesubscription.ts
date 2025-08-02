import { NextApiRequest, NextApiResponse } from "next";
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
      const plan = await prisma.subscriptions.update({
        where: {
          id: req.body.id,
        },
        data: {
          name: req.body.name,
          description: req.body.description,
          price: parseFloat(req.body.price),
          yearly_price: parseFloat(req.body.yearly_price),
          max_devices: parseInt(req.body.max_devices),
          max_locations: parseInt(req.body.max_locations),
        },
      });

      await prisma.subscription_features.deleteMany({
        where: {
          subscription_id: plan.id,
        },
      });

      for (const feature of req.body.subscription_feature) {
        await prisma.subscription_features.create({
          data: {
            subscription_id: plan.id,
            feature_id: feature,
          },
        });
      }
      res.status(StatusCodes.OK);
      res.json("subscription_updated");
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
