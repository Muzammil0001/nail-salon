import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
    }

    const { location_id: bodyLocationId } = req.body;

    let location_id = bodyLocationId;
    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user?.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_location_id" });
    }

    const sessions = await prisma.active_service_session.findMany({
      where: {
        location_id,
        ended_at: null,
      },
      include: {
        staff: true,
        reservation: {include:{reservation_details:true}},
        order:{include:{order_details:true}},
        location: true,
      },
    });

    const activeSessions = sessions.map((session) => ({
      ...session,
      service_type: session.order_id ? "ORDER" : "RESERVATION",
      is_completed: false,
    }));

    return res.status(StatusCodes.OK).json({
      message: "active_sessions_fetched",
      data: activeSessions,
    });
  } catch (error) {
    console.error("Fetch Active Sessions Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
