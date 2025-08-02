import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(
      req,
      res,
      true,
      ["SuperAdmin", "Owner", "BackOfficeUser"],
      "POST"
    );
    if (session) {
      const client: any = await prisma.user.update({
        where: {
          id: req.body.id,
          ...((session.user.roles.includes("Owner") ||
            session.user.roles.includes("BackOfficeUser")) && {
            client_id: session.user.roles.includes("Owner")
              ? session.user.id
              : session.user.client_id,
          }),
        },
        data: {
          deleted_status: true,
        },
      });
      res.status(StatusCodes.OK);
      res.json({ client, message: "client_deleted_successfully" });
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
