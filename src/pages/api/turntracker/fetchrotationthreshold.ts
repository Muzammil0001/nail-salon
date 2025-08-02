import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ error: "method_not_allowed" });
    }

    let { location_id } = req.body;

    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "missing_location_id" });
    }

    const threshold = await prisma.reservation_rotation_threshold.findFirst({
      where: { location_id },
    });

    if (!threshold) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: "appointment_threshold_not_found_please_set_appointment_threshold" });
    }

    return res.status(StatusCodes.OK).json({
      message: "appointment_threshold_fetched_successfully",
      data: threshold,
    });
  } catch (error) {
    console.error("Error fetching appointment threshold:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "internal_server_error" });
  }
}
