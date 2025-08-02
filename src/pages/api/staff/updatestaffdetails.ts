import type { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import { fileSaver } from "../../../../lib/filesaver";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res
      .status(StatusCodes.METHOD_NOT_ALLOWED)
      .json({ message: "method_not_allowed" });
  }

  try {
    const { id, first_name, last_name, phone, image, device_id, location_id } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "user_id_required" });
    }

    if (!device_id || !location_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "device_id_and_location_id_required" });
    }

    const device = await prisma.device.findFirst({
      where: {
        device_id,
        location_id,
        deleted_status: false,
        active_status: true,
      },
    });

    if (!device) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "invalid_device_or_location" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "user_not_found" });
    }

    const updateData: any = {};

    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (phone) updateData.phone = phone;

    if (image?.startsWith("data:image/")) {
      const savedImage = await fileSaver(
        image,
        `${process.env.NEXT_PUBLIC_SHARED_IMG_DIR}/images/clients`
      );

      if (!savedImage) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "image_upload_failed" });
      }

      updateData.image = savedImage;
    } else if (typeof image === "string") {
      updateData.image = image;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return res.status(StatusCodes.OK).json({
      message: "user_updated_successfully",
      user: updatedUser,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message });
  }
}
