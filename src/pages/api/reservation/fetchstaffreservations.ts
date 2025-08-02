import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
    }

    let { staff_id, location_id } = req.body;

    if (!staff_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_staff_id" });
    }

    let session = null;

    if (!location_id) {
      session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      const { user } = session;
      location_id = user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_location_id" });
    }

    const staffReservations = await prisma.reservations.findMany({
      where: {
        staff_id,
        location_id,
        deleted_status: false,
      },
      include:{reservation_details:true, reservation_transaction:true, reservation_customer:true},
      orderBy: {
        schedule_start_time: "asc",
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "reservations_fetched_successfully",
      reservations: staffReservations,
    });

  } catch (error) {
    console.error("Fetch Staff Reservations Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
