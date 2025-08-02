import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin"], "POST");
    if (!session) return;
    const { subscription_navigation } = req.body;
    await prisma.subscription_navigation.deleteMany({
      where: {
        subscription_id: {
          in: subscription_navigation.map(
            (item: { subscription_id: number }) => item.subscription_id
          ),
        },
      },
    });
    await prisma.subscription_navigation.createMany({
      data: subscription_navigation,
      skipDuplicates: true,
    });
    return res
      .status(StatusCodes.OK)
      .json({ message: "subscription_navigation_saved_successfully" });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
