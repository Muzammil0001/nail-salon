import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
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
    const {
      id,
      app_id,
      app_platform,
      app_version_number,
      app_version_build_number,
      app_version_optional,
      app_version_live,
    } = req.body;
    console.log("main id", app_id);
    console.log("Request Body:", req.body);

    const existingAppVersion = await prisma.app_version.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingAppVersion) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "app_version_not_found",
      });
    }

    const updatedAppVersion = await prisma.app_version.update({
      where: { id: id },
      data: {
        app_id,
        app_platform,
        app_version_number,
        app_version_build_number,
        app_version_optional: app_version_optional ?? true,
        app_version_live: app_version_live ?? false,
      },
    });

    await logActivity({
      message: `"${app_platform}" app version ${app_version_number} updated successfully`,
      req,
      res,
    });

    return res.status(StatusCodes.OK).json({
      message: "app_version_updated_successfully",
      updatedAppVersion,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
