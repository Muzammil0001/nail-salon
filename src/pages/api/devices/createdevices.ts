import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { handlePrismaError } from "../../../../lib/errorHandler";
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
    if (!session) {
      return;
    }
    if (req.method === "POST") {
      const { device_name, device_id } = req.body;

      if (!device_id) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "device_id_is_required" });
      }

      if (!device_name) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "device_name_is_required" });
      }

      const locationExists = await prisma.location.findUnique({
        where: { id: session.user.selected_location_id },
      });
      if (!locationExists) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ message: "location_not_found" });
      }

      const existingDevice = await prisma.device.findFirst({
        where: {
          location_id: session.user.selected_location_id,
          deleted_status: false,
          OR: [
            {
              device_name: {
                equals: device_name,
                mode: "insensitive",
              },
            },
            {
              device_id: {
                equals: device_id,
                mode: "insensitive",
              },
            },
          ],
        },
      });
      
      if (existingDevice) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "device_id_or_name_must_be_unique" });
      }

      const newDevice = await prisma.device.create({
        data: {
          device_name,
          device_id: device_id,
          location: {
            connect: { id: session.user.selected_location_id },
          },
        },
      });
      res.status(StatusCodes.CREATED).json({
        message: "device_created_successfully",
        data: newDevice,
      });
    } else {
      res
        .status(StatusCodes.METHOD_NOT_ALLOWED)
        .json({ message: "method_not_allowed" });
    }
  } catch (error) {
    console.error("Create Device Error:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
