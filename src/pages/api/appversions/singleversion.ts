import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res
        .status(StatusCodes.METHOD_NOT_ALLOWED)
        .json({ error: "method_not_allowed" });
    }

    const { id } = req.body;
    console.log(id);

    if (!id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "missing_required_field_id" });
    }

    const appVersion = await prisma.app_version.findUnique({
      where: { id },
      include: {
        app_name: true,
      },
    });

    if (!appVersion) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "app_version_not_found" });
    }

    return res.status(StatusCodes.OK).json({
      message: "app_version_fetched_successfully",
      appVersion,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
