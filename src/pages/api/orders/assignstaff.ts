import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { sendNotification } from "../../../../lib/firebaseHelper";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
    }

    let { order_id, staff_id, location_id } = req.body;

    if (!order_id || !staff_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_required_fields" });
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
    if (terminalStatuses.includes(order.order_status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: `cannot_assign_staff_to_${order.order_status.toLowerCase()}_order`,
      });
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: order_id },
      data: { staff_id },
      include: {
        staff: true, 
      },
    });

    const staff = updatedOrder.staff;
    if (staff?.fcm_token) {
      try {
        await sendNotification(
          staff.fcm_token,
          "New Service Order Assigned",
          `You've been assigned to order #${updatedOrder.order_number}`,
          {
            orderId: updatedOrder.id,
            totalAmount: updatedOrder.total_price,
            orderNumber: updatedOrder.order_number,
          }
        );
      } catch (notificationError) {
        console.error("FCM notification error:", notificationError);
      }
    }

    return res.status(StatusCodes.OK).json({
      message: "staff_assigned_successfully",
      order_id,
      staff_id,
    });
  } catch (error) {
    console.error("Assign Staff Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
