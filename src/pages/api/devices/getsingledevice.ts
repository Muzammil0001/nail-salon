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

    let device: any = await prisma.device.findFirst({
      where: {
        id: id,
        deleted_status: false,
        active_status: true,
      },
    });

    if (!device) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "device_not_found" });
    }
  
    res.status(StatusCodes.OK).json({
      message: "device_fetched_successfully",
      data: device,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
