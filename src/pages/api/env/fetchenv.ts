import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin"], "POST");
    if (!session) return;
    const { search = "", rowsPerPage = 10, page = 0 } = req.body;

    const baseFilter = {
      deleted_status: false,
    };

    const count = await prisma.configuration.count({
      where: {
        ...baseFilter,
        key: {
          contains: search,
          mode: "insensitive",
        },
      },
    });

    const configurations = await prisma.configuration.findMany({
      where: {
        ...baseFilter,
        key: {
          contains: search,
          mode: "insensitive",
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: rowsPerPage,
      skip: page * rowsPerPage,
    });

    res.status(StatusCodes.OK).json({
      message: "configurations_fetched_successfully",
      configurations,
      count,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
};

export default handler;
