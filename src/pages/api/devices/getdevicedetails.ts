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
    const session = await validateAPI(req, res, false, [], "POST");
    if (!session) {
      return;
    }
    const { device_id } = req.body;
    if (!device_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "device_id_is_required" });
    }

    const device = await prisma.device.findFirst({
      where: {
        device_id: `${device_id}`,
        deleted_status: false,
        active_status: true,
      },
      include: {
        location: true,
      },
    });
    console.log(device);

    if (!device) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "device_not_found" });
    }

    res.status(StatusCodes.OK).json(device);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
