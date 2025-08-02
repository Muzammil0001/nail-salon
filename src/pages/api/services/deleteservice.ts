import prisma from "../../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
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

    if (!session) return;

    const { user } = session;

    const client_id = user.roles.includes("Owner") ? user.id : user.client_id;

    const location_id = session.user.selected_location_id;

    const { service_id } = req.body;

    if (!service_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_service_id",
      });
    }

    const existingService = await prisma.services.findUnique({
      where: {
        id: service_id as string,
        deleted_status: false,
        location_id,
        client_id,
      },
    });

    if (!existingService) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "service_not_found",
      });
    }

    const orderDetails = await prisma.reservation_details.findFirst({
      where: {
        service_id: service_id as string,
        reservations: {
          deleted_status: false,
          reservation_status: {
            in: ["PENDING"],
          },
        },
      },
    });

    if (orderDetails) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "service_in_active_or_used_in_pending_appointment",
      });
    }

    const deletedService = await prisma.services.update({
      where: {
        id: service_id as string,
        location_id,
      },
      data: {
        deleted_status: true,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "service_deleted_successfully",
      service: deletedService,
    });
  } catch (error) {
    console.error("Service Deletion Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
