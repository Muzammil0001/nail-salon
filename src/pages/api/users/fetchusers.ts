import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let { location_id, fetchAll = false, search = "", rowsPerPage = 10, page = 1 } = req.body;

    let session = null;

    if (!location_id) {
      
      session = await validateAPI(req, res, true, ["SuperAdmin", "Owner","BackOfficeUser"], "POST");
      if (!session) return;

      const { user } = session;
      location_id = user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_location_id",
      });
    }

    const safeRowsPerPage = Math.max(Number(rowsPerPage), 10);
    const safePage = Math.max(Number(page), 1);

    const baseWhere: any = {
      location_id,
      deleted_status: false,
    };

    if (search) {
      baseWhere.OR = [
        {
          first_name: { contains: search, mode: "insensitive" },
        },
        {
          last_name: { contains: search, mode: "insensitive" },
        },
      ];
    }

    if (!session) {
      baseWhere.active_status = true;
    } else if (session.user.roles.includes("Owner")) {
      baseWhere.client_id = session.user.id;
    }

    const baseQuery: any = {
      where: baseWhere,
      include: {
        user_to_role: {
          include: { role: true },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    };

    let users;

    if (fetchAll) {
      users = await prisma.user.findMany(baseQuery);
    } else {
      users = await prisma.user.findMany({
        ...baseQuery,
        skip: (safePage - 1) * safeRowsPerPage,
        take: safeRowsPerPage,
      });
    }

    const count = await prisma.user.count({ where: baseWhere });

    return res.status(StatusCodes.OK).json({ users, count });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
