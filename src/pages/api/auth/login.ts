import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const DEVICE_ROLE_MAPPING: Record<string, string[]> = {
  EMPLOYEE: ["Employee"],
};

const getMidnightExpiry = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); 
  return Math.floor(midnight.getTime() / 1000);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
    }

    const { pin, device_id } = req.body;

    if (!pin || !device_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Pin and device_id are required." });
    }

    const device = await prisma.device.findFirst({
      where: {
        device_id,
        deleted_status: false,
        active_status: true,
      },
      select: {
        location_id: true,
      },
    });

    if (!device) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "invalid_device_or_inactive_device" });
    }

    const { location_id } = device;

    const user = await prisma.user.findFirst({
      where: {
        pin: `${pin}`,
        location_id,
        deleted_status: false
      },
      include: {
        location:true,
        user_to_role: {
          include: {
            role: true,
          },
        },
        staff_accessrights: true,
      },
    });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "invalid_pin_or_user_not_found" });
    }

    const roles = user.user_to_role.map((userRole:any) => userRole.role.name);


    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      },
      JWT_SECRET,
      { expiresIn: getMidnightExpiry() - Math.floor(Date.now() / 1000) }
    );

    let mainPosFeatureSetting = null;
    let waiterAppFeatureSetting = null;
    
    return res.status(StatusCodes.OK).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        image: user.image,
        active_status: user.active_status,
        user_main: user.user_main,
        password_changed: user.password_changed,
        location_id: user.location_id,
        roles,
        permissions: user.staff_accessrights,
        client_id: user.client_id,
      },
      main_pos_feature_setting: mainPosFeatureSetting,
      waiter_app_feature_setting: waiterAppFeatureSetting,
      token,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message });
  }
}
