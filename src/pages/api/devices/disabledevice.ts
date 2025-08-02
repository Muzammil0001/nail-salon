import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { handlePrismaError } from "../../../../lib/errorHandler";
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
    if (!session) {
      return;
    }

    const { id } = req.body;

    if (!id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "device_id_is_required" });
    }

    const device = await prisma.device.findFirst({
      where: { id },
      select: { active_status: true },
    });

    if (!device) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "device_not_found" });
    }

    const updatedDevice = await prisma.device.update({
      where: { id },
      data: { active_status: !device.active_status },
    });

    res.status(StatusCodes.OK).json({
      message: "status_updated!",
      data: updatedDevice,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
