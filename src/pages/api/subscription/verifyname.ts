import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, false, [], "POST");
    if (session) {
      let plans: any[] = [];

      if (req.body.action == "view") {
        plans = await prisma.subscriptions.findMany({
          where: {
            name: req.body.name,
            id: {
              not: req.body.id,
            },
            deleted_status: false,
          },
        });
      } else {
        plans = await prisma.subscriptions.findMany({
          where: {
            name: req.body.name,
            deleted_status: false,
          },
        });
      }
      res.status(StatusCodes.OK);
      res.json(!(plans.length > 0));
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
