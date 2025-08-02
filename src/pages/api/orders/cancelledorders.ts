import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      message: "method_not_allowed",
    });
  }

  try {
    let { order_id, status, location_id } = req.body;

    if (!order_id || status !== "CANCELLED") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_or_invalid_fields",
      });
    }

    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;

      location_id = session?.user?.selected_location_id;
      if (!location_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_location_id" });
      }
    }

    const existingOrder = await prisma.orders.findFirst({
      where: {
        id: order_id,
        location_id,
      },
    });

    if (!existingOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "order_not_found_or_unauthorized",
      });
    }

    if (existingOrder.order_status === "CANCELLED") {
      return res.status(StatusCodes.CONFLICT).json({
        message: "order_already_cancelled",
      });
    }

    if (existingOrder.order_status === "COMPLETED") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "completed_order_cannot_be_cancelled",
      });
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: order_id },
      data: {
        order_status: "CANCELLED",
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "order_cancelled_successfully",
      order: updatedOrder,
    });

  } catch (err) {
    console.error("Cancel Order Error:", err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
