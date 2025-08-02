import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
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

    if (!category_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "a_valid_category_id_is_required" });
    }

    const category = await prisma.categories.findUnique({
      where: { id: category_id , deleted_status:false},
      include: {
        client: { select: { id: true, email: true } },
        location: { select: { id: true } },
        services: { select: { id: true, name: true, price: true } },
      },
    });

    if (!category) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "category_not_found" });
    }

    return res.status(StatusCodes.OK).json({
      category,
    });
  } catch (error) {
    console.error("Error fetching category details:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
