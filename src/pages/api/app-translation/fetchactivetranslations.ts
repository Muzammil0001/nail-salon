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

    if (!session) {
      return;
    }

    const clientTranslations = await prisma.translation_language.findMany({
      where: {
        deleted_status: false,
        active_status: true,
      },
      include: {
        language: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return res.status(StatusCodes.OK).json(clientTranslations);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
