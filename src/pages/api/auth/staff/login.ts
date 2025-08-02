import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../../lib/prisma";
import { verifyPassword } from "../../../../../lib/authHelper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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

    let { email, password, device_id, bypass_device_check = false } = req.body;

    if (bypass_device_check) {
      const fetchDevice = await prisma.device.findFirst({
        where: {
          deleted_status: false,
          active_status: true,
        }
      });

      device_id = fetchDevice?.id;
    }

    if (!email || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email and password (or pin) are required." });
    }

    if (!device_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Missing device_id" });
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

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        deleted_status: false,
      },
    });

    if (!existingUser) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "invalid_email_or_password" });
    }

    const isPinMatch = existingUser.pin === password;
    const isPasswordMatch = existingUser.password
      ? await verifyPassword(password, existingUser.password)
      : false;

    if (!isPinMatch && !isPasswordMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "invalid_email_or_password" });
    }

    const userRoles = await prisma.user_to_role.findMany({
      where: { user_id: existingUser.id },
      include: { role: true },
    });

    const isOwner = userRoles.some((r) => r.role.name === "Owner");

    const user = await prisma.user.findFirst({
      where: {
        email,
        ...(isOwner ? {} : { location_id }),
        deleted_status: false,
      },
      include: {
        location: true,
        user_to_role: {
          include: {
            role: true,
          },
        },
        staff_accessrights: true,
      },
    });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "invalid_email_or_password" });
    }

    const roles = user.user_to_role.map((userRole: any) => userRole?.role.name);

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
        is_staff: isPinMatch,
      },
      token,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ message });
  }
}
