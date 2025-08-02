import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import { verifyTokenAndDevice } from "../../../../lib/verifyToken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(StatusCodes.METHOD_NOT_ALLOWED)
      .json({ message: "method_not_allowed" });
  }

  const session = await verifyTokenAndDevice(req);
  if (!session) return;

  try {
    const { location_id } = req.body;

    if (!location_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "location_id_required" });
    }

    const services = await prisma.services.findMany({
      where: {
        location_id,
        deleted_status: false,
      },
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        name: true,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "services_fetched_successfully",
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services by location_id:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
