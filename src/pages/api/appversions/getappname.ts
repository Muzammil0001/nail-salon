import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { handlePrismaError } from "../../../../lib/errorHandler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res
        .status(StatusCodes.METHOD_NOT_ALLOWED)
        .json({ error: "method_not_allowed" });
    }

    const appNames = await prisma.app_names.findMany({
      include: {
        app_versions: true,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "app_names_fetched_successfully",
      app_names: appNames,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
