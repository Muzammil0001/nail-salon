import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";
import { handlePrismaError } from "../../../../lib/errorHandler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await validateAPI(
    req,
    res,
    true,
    ["SuperAdmin", "Owner", "BackOfficeUser"],
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

  try {
    const location = await prisma.location.findUnique({
      where: { id: id },
    });

    if (!location) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "location_not_found" });
    }

    const updatedLocation = await prisma.location.update({
      where: { id: id },
      data: { active_status: !location.active_status },
    });

    return res.status(StatusCodes.OK).json({
      updatedLocation,
      message: "location_status_updated_successfully",
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
