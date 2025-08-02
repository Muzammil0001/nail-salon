import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        message: "method_not_allowed",
      });
    }

    const { email, location_id } = req.body;

    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "email_is_required",
      });
    }

    let locationId = location_id;

    if (!locationId) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session?.user?.selected_location_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "location_id_required",
        });
      }
      locationId = session.user.selected_location_id;
    }

    const customer = await prisma.reservation_customer.findFirst({
      where: {
        email: email.toLowerCase(),
        deleted_status: false,
        active_status: true,
        is_verified:true,
      },
    });

    if (!customer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "customer_not_found",
      });
    }

    return res.status(StatusCodes.OK).json({
      message: "customer_fetched_successfully",
      customer,
    });
  } catch (error) {
    console.error("Fetch Reservation Customer Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
