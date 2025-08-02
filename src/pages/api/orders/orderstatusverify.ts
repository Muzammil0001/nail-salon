import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { transaction_type } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        message: "method_not_allowed",
      });
    }

    const orderId = req.body.id as string;

    if (!orderId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_order_id" });
    }

    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
      },
      select: {
        verified: true,
      },
    });

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "order_not_found" });
    }

    return res.status(StatusCodes.OK).json({
      message: "order_found",
      verified: order.verified,
    });
  } catch (error) {
    console.error("Error checking order verification:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
      error: error instanceof Error ? error.message : error,
    });
  }
}
