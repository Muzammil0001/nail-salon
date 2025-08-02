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
    let { id, location_id } = req.body;
    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;

      const { user } = session;
      location_id = user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_location_id",
      });
    }
    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "id_is_required",
      });
    }

    const updatedAppVersion = await prisma.reservations.update({
      where: { id },
      data: {
        deleted_status: true,
      },
    });

    await logActivity({
      message: `deleted successfully.`,
      req,
      res,
    });

    return res.status(StatusCodes.OK).json({
      message: "deleted_successfully",
      updatedAppVersion,
    });
  } catch (error) {
    console.log("~ error:", error)
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
