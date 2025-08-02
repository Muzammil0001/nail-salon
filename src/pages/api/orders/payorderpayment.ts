import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
    }

    let { order_id, payment_status, location_id } = req.body;

    if (!order_id || !payment_status) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_required_fields" });
    }

    const validStatuses = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"];
    if (!validStatuses.includes(payment_status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "invalid_payment_status" });
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
      include: { order_transaction: true },
    });

    if (!order || order.location_id !== location_id) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "order_not_found_or_unauthorized" });
    }

    const currentStatus = order.order_transaction?.payment_status ?? (
      order.payment_method === "CASH" ? "PENDING" : null
    );

    if (!currentStatus) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "no_transaction_found" });
    }

    if (
      (currentStatus === "FAILED" || currentStatus === "REFUNDED") &&
      payment_status === "SUCCESS"
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "cannot_change_failed_or_refunded_to_success",
      });
    }

    if (order.order_transaction) {
      await prisma.order_transaction.update({
        where: { id: order.order_transaction.id },
        data: { payment_status },
      });
    } else if (order.payment_method === "CASH") {
      await prisma.order_transaction.create({
        data: {
          order_id: order.id,
          type: "CASH",
          amount: order.total_price,
          payment_status,
        },
      });
    }

    await prisma.orders.update({
      where: { id: order.id },
      data: { payment_status },
    });

    return res.status(StatusCodes.OK).json({
      message: "payment_status_updated",
      order_id,
      new_payment_status: payment_status,
    });

  } catch (error) {
    console.error("Update Order Payment Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
