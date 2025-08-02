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
    const {
      app_id,
      app_platform,
      app_version_number,
      app_version_build_number,
      app_version_optional,
      app_version_live,
    } = req.body;

    const existingAppVersion = await prisma.app_version.findFirst({
      where: {
        app_id,
        app_platform,
        deleted_status: false,
      },
    });

    if (existingAppVersion) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error:
          "app_version_with_this_selected_application_and_app_platform_already_exists",
      });
    }

    const newAppVersion = await prisma.app_version.create({
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
      message: `"${app_platform}" app version ${app_version_number} created successfully`,
      req,
      res,
    });

    return res
      .status(StatusCodes.CREATED)
      .json({ message: "app_version_created_successfully", newAppVersion });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
