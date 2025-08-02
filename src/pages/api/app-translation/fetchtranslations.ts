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
      true,
      ["SuperAdmin"],
      "POST"
    );

    if (!session) {
      return;
    }

    const { search, rowsPerPage = 10, page = 0 } = req.body;

    const count = await prisma.translation_language.count({
      where: {
        deleted_status: false,
        ...(search && {
          language: {
            language_name: {
              contains: search,
              mode: "insensitive",
            },
          },
        }),
      },
    });

    const clientTranslations = await prisma.translation_language.findMany({
      where: {
        deleted_status: false,
        ...(search && {
          language: {
            language_name: {
              contains: search,
              mode: "insensitive",
            },
          },
        }),
      },
      include: {
        language: true,
      },
      orderBy: {
        id: "desc",
      },
      take: rowsPerPage,
      skip: page * rowsPerPage,
    });

    return res.status(StatusCodes.OK).json({
      message: "translations_fetched_successfully",
      data: clientTranslations,
      totalCount: count,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
