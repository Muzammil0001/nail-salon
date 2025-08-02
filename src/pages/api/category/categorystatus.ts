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

    if (!session) {
      return;
    }
 
    const { category_id } = req.body;

    if (!category_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "invalid_or_missing_category_id" });
    }

    const category = await prisma.categories.findUnique({
      where: { id: category_id , deleted_status:false},
    });

    if (!category) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "category_not_found" });
    }

    await prisma.categories.update({
      where: { id: category_id, deleted_status:false },
      data: {
        active_status: !category.active_status,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "category_status_updated_successfully",
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
