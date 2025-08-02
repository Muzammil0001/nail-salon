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
      const clients = await prisma.user.findMany({
        where: {
          deleted_status: false,
          subscription_id: req.body.id,
        },
      });
      if (clients.length > 0) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "subscription_in_use" });
      }
      await prisma.subscriptions.update({
        where: {
          id: req.body.id,
        },
        data: {
          deleted_status: true,
        },
      });

      res.status(StatusCodes.OK);
      res.json("subscription_deleted");
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
