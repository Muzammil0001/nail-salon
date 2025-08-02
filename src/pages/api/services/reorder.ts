import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
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

    const location_id = session?.user?.selected_location_id;

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_location_id",
      });
    }

    const { services } = req.body;

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "invalid_or_missing_services_array",
      });
    }

    const invalid = services.some(
      (s) => !s.id || typeof s.sort_order !== "number"
    );

    if (invalid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "each_service_must_have_id_and_sort_order",
      });
    }

    await prisma.$transaction(
      services?.map((s) =>
        prisma.services.updateMany({
          where: {
            id: s.id,
            deleted_status: false,
          },
          data: {
            sort_order: s.sort_order,
          },
        })
      )
    );
    await prisma.services.updateMany({
        where: { deleted_status: true },
        data: { sort_order: -1 },
      });

    return res.status(StatusCodes.OK).json({
      message: "service_order_updated_successfully",
    });
  } catch (error) {
    console.error("Service Reorder Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
