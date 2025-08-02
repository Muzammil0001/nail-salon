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
      let clients: any[] = [];

      if (req.body.action == "view") {
        clients = await prisma.user.findMany({
          where: {
            username: req.body.username,
            deleted_status: false,
            id: {
              not: req.body.id,
            },
          },
        });
      } else {
        clients = await prisma.user.findMany({
          where: {
            username: req.body.username,
            deleted_status: false,
          },
        });
      }

      res.status(StatusCodes.OK);
      res.json(!(clients.length > 0));
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
