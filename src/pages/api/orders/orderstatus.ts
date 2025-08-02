import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
    }

    let { order_id, order_status, location_id } = req.body;

    if (!order_id || !order_status) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_required_fields" });
    }

    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "FAILED"];
    if (!validStatuses.includes(order_status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "invalid_order_status" });
    }

    let session = null;
    if (!location_id) {
      session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_location_id" });
    }

    const order = await prisma.orders.findUnique({
      where: { id: order_id },
    });

    if (!order || order.location_id !== location_id) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "order_not_found_or_unauthorized" });
    }

    const terminalStatuses = ["CANCELLED", "COMPLETED", "FAILED"];
    if (terminalStatuses.includes(order.order_status) && order.order_status !== order_status) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: `cannot_change_status_from_${order.order_status.toLowerCase()}`,
      });
    }

    if (order_status === "COMPLETED" && order.payment_status !== "SUCCESS") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "cannot_complete_order_with_failed_or_pending_payment",
        current_payment_status: order.payment_status,
      });
    }

    await prisma.orders.update({
      where: { id: order_id },
      data: { order_status },
    });

    return res.status(StatusCodes.OK).json({
      message: "order_status_updated",
      order_id,
      new_order_status: order_status,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
