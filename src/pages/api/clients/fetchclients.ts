import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await validateAPI(
      req,
      res,
      true,
      ["SuperAdmin", "Owner", "BackOfficeUser"],
      "POST"
    );
    if (!session) return;

    const {
      fetchAll = false,
      search = "",
      rowsPerPage = 10,
      page = 1,
    } = req.body;
    
    const currentPage = Math.max(Number(page) || 1, 1);
    const take = Number(rowsPerPage);
    const skip = (currentPage - 1) * take;
    
    const whereCondition = {
      role: {
        name: "Owner",
      },
      deleted_status: false,
      ...(search && {
        OR: [
          { username: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { first_name: { contains: search, mode: "insensitive" } },
          { last_name: { contains: search, mode: "insensitive" } },
        ],
      }),
    };
    
    const users = await prisma.user.findMany({
      where: whereCondition,
      ...(fetchAll ? {} : { skip, take }),
      orderBy: {
        created_at: "desc",
      },
    });
    
    const totalCount = await prisma.user.count({
      where: whereCondition,
    });
    
    return res.status(StatusCodes.OK).json({
      clients: users,
      count: totalCount,
      page: fetchAll ? 1 : currentPage,
      rowsPerPage: fetchAll ? totalCount : take,
    });
    
  } catch (error) {
    console.error("Error fetching owners:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
