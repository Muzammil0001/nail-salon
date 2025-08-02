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
      ["Owner", "BackOfficeUser"],
      "POST"
    );
    if (!session) return;

    const { category_id } = req.body;

    if (!category_id || typeof category_id !== "string") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "invalid_or_missing_category_id" });
    }

    const reserveredServices = await prisma.reservation_details.findFirst({
      where: {
        service: {
          category_id: category_id,
        },
      },
    });

    if (reserveredServices) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message:
          "cannot_delete_category_service_in_this_category_have_been_reserved",
      });
    }

    await prisma.$transaction([
      prisma.services.updateMany({
        where: { category_id },
        data: { deleted_status: true },
      }),
      prisma.categories.update({
        where: { id: category_id },
        data: { deleted_status: true },
      }),
    ]);

    return res.status(StatusCodes.OK).json({
      message: "category_deleted_successfully",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
