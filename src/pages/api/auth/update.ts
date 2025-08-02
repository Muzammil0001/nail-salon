// pages/api/user/updatePin.ts
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import { handlePrismaError } from "../../../../lib/errorHandler"; // Adjust the import path
import sendEmail from "../../../../lib/sendEmail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res
        .status(StatusCodes.METHOD_NOT_ALLOWED)
        .json({ message: "method_not_allowed" });
    }

    const { id, newPin, device_id } = req.body;

    // Validate input
    if (!id || !newPin) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Both id and new PINs are required." });
    }

    const device = await prisma.device.findFirst({
      where: {
        device_id: device_id,
        deleted_status:false,
        active_status: true
      },
      select: {
        location_id: true
      }
    })
    let location_id = null;
    if(device !== null){
      location_id = device.location_id
    }

    const currentPinUsage = await prisma.user.findFirst({
      where: {
        location_id: location_id,
        pin: `${newPin}`,
        deleted_status: false,
      }
    })
    if(currentPinUsage !== null){
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "new_pin_is_already_in_use_please_choose_a_different_pin" });
    }

    // Find the user by ID
    const user = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "user_not_found" });
    }

    // Update user with the new PIN
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pin: `${newPin}`,
        password_changed: true,
      },
    });

    if (user.email) {
      await sendEmail(
        user.email,
        "PIN Change Confirmation",
        `Hello ${user.first_name || "User"},\n\nYour PIN has been successfully updated.\n\nIf you did not make this change, please contact support immediately.`,
        `<p>Hello <strong>${user.first_name || "User"}</strong>,</p>
         <p>Your PIN has been successfully updated.</p>`
      );
    }

    return res
      .status(StatusCodes.OK)
      .json({ message: "pin_updated_successfully" });
  } catch (error) {
    const errorResponse = handlePrismaError(error);
    return res
      .status(errorResponse.statusCode)
      .json({ message: errorResponse.message });
  }
}
