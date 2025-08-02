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
      ["Owner", "BackOfficeUser"],
      "POST"
    );
    if (session) {
      let count = 0;
      let locations;
      if (req.body.fetchAll) {
        locations = await prisma.location.findMany({
          where: {
            deleted_status: false,
            ...((session.user.roles.includes("Owner") ||
              session.user.roles.includes("BackOfficeUser")) && {
              client_id: session.user.roles.includes("Owner")
                ? session.user.id
                : session.user.client_id,
            }),
          },
        });
      } else {
        count = await prisma.location.count({
          where: {
            deleted_status: false,
            ...(req.body.search && {
              location_name: {
                contains: req.body.search,
                mode: "insensitive",
              },
            }),
            ...((session.user.roles.includes("Owner") ||
              session.user.roles.includes("BackOfficeUser")) && {
              client_id: session.user.roles.includes("Owner")
                ? session.user.id
                : session.user.client_id,
            }),
          },
        });
        locations = await prisma.location.findMany({
          where: {
            deleted_status: false,
            ...(req.body.search && {
              location_name: {
                contains: req.body.search,
                mode: "insensitive",
              },
            }),
            ...((session.user.roles.includes("Owner") ||
              session.user.roles.includes("BackOfficeUser")) && {
              client_id: session.user.roles.includes("Owner")
                ? session.user.id
                : session.user.client_id,
            }),
          },

          take: parseInt(req.body.rowsPerPage),
          skip: parseInt(req.body.page) * parseInt(req.body.rowsPerPage),
        });
      }

      res.status(StatusCodes.OK);
      res.json({ locations, count });
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
