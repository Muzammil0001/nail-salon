import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { handlePrismaError } from "../../../../lib/errorHandler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const baseFilter = {
      deleted_status: false,
      active_status:true,
    };

    const languages = await prisma.languages.findMany({
      where: baseFilter,
      orderBy: {
        language_name: "asc",
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "languages_fetched_successfully",
      languages,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
