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
    if (req.method === "POST") {
      const { id } = req.body;
      if (!id) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "device_id_is_required" });
      }
      const updatedDevice = await prisma.device.update({
        where: { id },
        data: { deleted_status: true },
      });
      res.status(StatusCodes.OK).json({
        message: "device_deleted_successfully",
        data: updatedDevice,
      });
    } else {
      res
        .status(StatusCodes.METHOD_NOT_ALLOWED)
        .json({ error: "method_not_allowed" });
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
