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
      let users: any[] = [];

      if (req.body.action == "view") {
        users = await prisma.user.findMany({
          where: {
            email: req.body.email,
            deleted_status: false,
            id: {
              not: req.body.id,
            },
          },
        });
      } else {
        users = await prisma.user.findMany({
          where: {
            email: req.body.email,
            deleted_status: false,
          },
        });
      }

      res.status(StatusCodes.OK);
      res.json(!(users.length > 0));
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
