import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";
import { handlePrismaError } from "../../../../lib/errorHandler";

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

    const { id } = req.body;

    if (!id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "location_id_is_required" });
    }
    const location = await prisma.location.update({
      where: { id: id },
      data: { deleted_status: true },
    });

    return res
      .status(StatusCodes.OK)
      .json({ message: "location_deleted_successfully" });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
