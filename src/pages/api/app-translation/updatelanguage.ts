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
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        message: "method_not_allowed",
      });
    }

    const { user_id, translation_language_id } = req.body;

    if (!user_id || !translation_language_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_user_or_language_id",
      });
    }

    await prisma.user_translation_language.upsert({
      where: {
        user_id,
      },
      create: {
        user_id,
        translation_language_id,
      },
      update: {
        translation_language_id,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "translation_language_updated",
    });
  } catch (error) {
    console.error("Error updating translation language:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
