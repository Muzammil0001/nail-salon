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
      ["SuperAdmin", "Owner","BackOfficeUser"],
      "POST"
    );
    if (!session) return;
    
    const user = await prisma.user.findUnique({
      where: {
        id: req.body.id, deleted_status: false
      },
      select: {
        active_status: true,
        first_name: true,
        last_name: true,
        location_id: true,
      },
    });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "user_not_found" });
    }

    const newStatus = !user.active_status;

    await prisma.user.update({
      where: {
        id: req.body.id,
      },
      data: {
        active_status: newStatus,
      },
    });

    await prisma.activity_logs.create({
      data: {
        user_id: session.user.roles.includes("Owner") ? session.user.id : session.user.client_id,
        location_id: user.location_id || session.user.selected_location_id || null,
        message: `User ${user.first_name} ${user.last_name} has been ${newStatus ? "activated" : "deactivated"}.`,
        message_type: newStatus ? "success" : "warn",
      },
    });

    res.status(StatusCodes.OK).json({
      message: "user_status_toggled_successfully",
      new_status: newStatus,
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
