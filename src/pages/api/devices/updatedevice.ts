import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { handlePrismaError } from "../../../../lib/errorHandler";
import { StatusCodes } from "http-status-codes";
import validateAPI from "../../../../lib/valildateApi";
import { Prisma } from "@prisma/client";

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

    const { id, device_name, device_id } = req.body;

    if (!id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "device_id_is_required" });
    }

    const existingDevice = await prisma.device.findFirst({
      where: { id: id },
    });
    if (!existingDevice) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "device_not_found" });
    }

    const orConditions: Prisma.deviceWhereInput[] = [];

    if (device_id) {
      orConditions.push({
        device_id: {
          equals: device_id,
          mode: "insensitive",
        } as Prisma.StringFilter,
      });
    }
    
    if (device_name) {
      orConditions.push({
        device_name: {
          equals: device_name,
          mode: "insensitive",
        } as Prisma.StringFilter,
      });
    }
    
    if (orConditions.length > 0) {
      const duplicateDevice = await prisma.device.findFirst({
        where: {
          id: {
            not: id,
          },
          deleted_status: false,
          OR: orConditions,
        },
      });
    
      if (duplicateDevice) {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ message: "device_id_or_name_must_be_unique" });
      }
    }

    const updatedDevice = await prisma.device.update({
      where: { id: id },
      data: {
        device_name,
        device_id: device_id || existingDevice.device_id,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "device_updated_successfully",
      data: updatedDevice,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
