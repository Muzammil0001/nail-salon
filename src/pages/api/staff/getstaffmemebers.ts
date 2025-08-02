// src/pages/api/staff/getstaffmemebers.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import { verifyTokenAndDevice } from "../../../../lib/verifyToken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await verifyTokenAndDevice(req);
    if (!session) return;

    if (req.method !== "POST") {
      return res
        .status(StatusCodes.METHOD_NOT_ALLOWED)
        .json({ message: "method_not_allowed" });
    }

    const staffUsers = await prisma.user.findMany({
      where: {
        user_to_role: {
          some: {
            role: {
              name: "Staff",
            },
          },
        },
        deleted_status: false,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "staff_users_fetched",
      data: staffUsers,
    });
  } catch (error) {
    console.error("Error fetching staff users:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
