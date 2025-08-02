import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { handlePrismaError } from "../../../../lib/errorHandler";

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
    if (!session) {
      return;
    }

    let count = 0;
    let locations;

    const {
      fetchAll,
      search,
      page = 0,
      rowsPerPage = 10,
    } = req.body;

    const pageNumber = parseInt(page as string);
    const pageSize = parseInt(rowsPerPage as string);

    const baseWhereClause: any = {
      deleted_status: false,
      ...(search && {
        location_name: {
          contains: search,
          mode: "insensitive",
        },
      }),
      ...((session.user.roles.includes("Owner") ||
        session.user.roles.includes("BackOfficeUser")) && {
        client_id: session.user.roles.includes("Owner")
          ? session.user.id
          : session.user.client_id,
      }),
      ...(session.user.roles.includes("BackOfficeUser") && {
        id: {
          in: session.user.accessrights?.controls?.locations?.map(
            (l: any) => l.location_id
          ),
        },
      }),
    };

    if (fetchAll) {
      locations = await prisma.location.findMany({
        where: baseWhereClause,
        include: {
          location_schedule: true,
        },
        orderBy: {
          location_name: "asc",
        },
      });
    } else {
      count = await prisma.location.count({ where: baseWhereClause });
      locations = await prisma.location.findMany({
        where: baseWhereClause,
        include: {
          location_schedule: true,
        },
        orderBy: {
          location_name: "asc",
        },
        take: pageSize,
        skip: pageNumber * pageSize,
      });
    }

    res.status(StatusCodes.OK).json({ locations, count });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
