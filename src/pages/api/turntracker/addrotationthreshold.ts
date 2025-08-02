import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ error: "method_not_allowed" });
    }

    let { location_id, threshold } = req.body;

    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "missing_location_id" });
    }

    const thresholdNumber = Number(threshold);
    if (isNaN(thresholdNumber) || thresholdNumber <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "invalid_reservation_threshold" });
    }

    const existing = await prisma.reservation_rotation_threshold.findUnique({
      where: { location_id },
    });

    let result;

    if (existing) {
      result = await prisma.reservation_rotation_threshold.update({
        where: { location_id },
        data: { reservation_threshold: thresholdNumber },
      });
    } else {
      result = await prisma.reservation_rotation_threshold.create({
        data: {
          location_id,
          reservation_threshold: thresholdNumber,
        },
      });
    }

    return res.status(StatusCodes.OK).json({
      message: existing ? "reservation_threshold_updated" : "reservation_threshold_created",
      data: result,
    });
  } catch (error) {
    console.error("Error in reservation threshold API:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "internal_server_error" });
  }
}
