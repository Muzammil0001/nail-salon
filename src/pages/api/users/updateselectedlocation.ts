import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await validateAPI(
      req,
      res,
      true,
      ["Owner", "BackOfficeUser"],
      "POST"
    );

    if (!session) return;

    const { location_id } = req.body;

    if (!location_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "no_location_selected" });
    }

    const location = await prisma.location.findFirst({
      where: {
        client_id: session.user.roles.includes("Owner")
          ? session.user.id
          : session.user.client_id,
        deleted_status: false,
        id: location_id,
      },
    });

    if (!location) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "location_not_found" });
    }

    await prisma.selected_location.update({
      where: {
        user_id: session.user.id,
      },
      data: {
        location_id: location.id,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "location_updated_successfully",
    });
  } catch (error) {
    console.error("Error updating selected location:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
