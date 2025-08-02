import prisma from "../../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
    if (!session) return;

    const { service_id } = req.body;
    const location_id = session.user.selected_location_id

    if (!service_id || !location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "invalid_or_missing_service_id_or_location_id",
      });
    }

    const service = await prisma.services.findUnique({
      where: {
        id: service_id,
        location_id: location_id,
        deleted_status: false,
      },
      select: {
        id: true,
        active_status: true,
      },
    });

    if (!service) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "service_not_found_or_invalid_location",
      });
    }

    const updatedService = await prisma.services.update({
      where: { id: service_id },
      data: { active_status: !service.active_status },
    });

    return res.status(StatusCodes.OK).json({
      message: "service_status_updated_successfully",
      active_status: updatedService.active_status,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
