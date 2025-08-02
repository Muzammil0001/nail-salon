import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import { handlePrismaError } from "../../../../lib/errorHandler";
import prisma from "../../../../lib/prisma";
import { logActivity } from "../../../../lib/logActivity";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin"], "POST");

    if (!session) {
      return;
    }
    const { id } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "app_version_id_is_required",
      });
    }

    const updatedAppVersion = await prisma.app_version.update({
      where: { id },
      data: {
        deleted_status: true,
      },
    });

    await logActivity({
      message: `App version with ID ${id} deleted successfully.`,
      req,
      res,
    });

    return res.status(StatusCodes.OK).json({
      message: "app_version_deleted_successfully",
      updatedAppVersion,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
