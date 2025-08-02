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
      req.body.language_id ? false : true,
      ["SuperAdmin", "Owner", "BackOfficeUser"],
      "POST"
    );

    if (!session?.user?.language_id && !req.body.language_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "language_id_required" });
    }
    const translation = await prisma.translation_page.findFirst({
      where: {
        page_name: req.body.page_name,
        translation_language_id:
          session?.user?.language_id || req.body.language_id,
      },
      include: {
        translation_page_text: true,
      },
      orderBy: {
        id: "desc",
      },
    });
    if (!translation) {
      return res.status(StatusCodes.OK).json([]);
    }

    return res.status(StatusCodes.OK).json(translation.translation_page_text);
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
