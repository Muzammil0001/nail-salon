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
    const translation = await prisma.translation_language.findFirst({
      where: {
        deleted_status: false,
        id: req.body.id,
      },
      orderBy: {
        id: "desc",
      },
    });
    if (!translation) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "translation_not_found" });
    }

    return res.status(StatusCodes.OK).json(translation);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
