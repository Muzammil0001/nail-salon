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

    const client_id = user.roles.includes("Owner")
      ? user.id
      : user.client_id;

    const location_id = session.user.selected_location_id;

    const {
      name,
      description = "",
      price = 0,
      duration_minutes = 0,
      active_status = true,
      category_id,
      material_cost,
    } = req.body;

    if (
      !name ||
      !category_id ||
      !location_id ||
      !client_id
    ) {
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
        name: {
          equals: name,
          mode: "insensitive",
        },
        category_id,
        deleted_status: false,
      },
    });

    if (existingService) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "entered_name_already_exists",
      });
    }

    const maxSortOrder = await prisma.services.aggregate({
      _max: { sort_order: true },
    });

    const newSortOrder = (maxSortOrder._max.sort_order ?? -1) + 1;

    const newService = await prisma.services.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        duration_minutes: parseInt(duration_minutes),
        active_status: !!active_status,
        category_id,
        location_id,
        client_id,
        sort_order: newSortOrder,
        material_cost: parseFloat(material_cost),
      },
    });

    return res.status(StatusCodes.CREATED).json({
      message: "service_created_successfully",
      service: newService,
    });
  } catch (error) {
    console.error("Service Create Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
