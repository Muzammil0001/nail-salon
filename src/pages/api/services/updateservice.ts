import prisma from "../../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import validateAPI from "../../../../lib/valildateApi";
import { fileSaver } from "../../../../lib/filesaver";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

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

    const {
      service_id,
      name,
      description = "",
      price = 0,
      duration_minutes = 0,
      active_status = true,
      category_id,
      material_cost,
    } = req.body;

    if (!service_id || !name || !category_id || !location_id || !client_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "missing_required_fields" });
    }

    const parsedDuration = parseInt(duration_minutes);

    if (isNaN(parsedDuration) || parsedDuration > 2147483647) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "invalid_duration_minutes",
      });
    }
    const existingService = await prisma.services.findFirst({
      where: {
        id: service_id,
        deleted_status: false,
      },
    });

    if (!existingService) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "service_not_found",
      });
    }

    const duplicateService = await prisma.services.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        category_id,
        deleted_status: false,
        NOT: {
          id: service_id,
        },
      },
    });

    if (duplicateService) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "entered_name_already_exists_in_this_category",
      });
    }

    const updatedService = await prisma.services.update({
      where: { id: service_id },
      data: {
        name,
        description,
        price: parseFloat(price),
        duration_minutes: parseInt(duration_minutes),
        active_status: !!active_status,
        category_id,
        location_id,
        client_id,
        material_cost: parseFloat(material_cost),
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "service_updated_successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("Service Update Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
