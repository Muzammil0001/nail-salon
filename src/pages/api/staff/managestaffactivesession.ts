import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

const TERMINAL_STATUSES = ["FAILED", "CANCELLED", "CANCELED"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
    }

    const {
      reservation_id,
      order_id,
      staff_id,
      location_id: bodyLocationId,
    } = req.body;

    let location_id = bodyLocationId;
    let is_completed = false;
    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user?.selected_location_id;
    }

    if (reservation_id && order_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "only_one_id_is_allowed" });
    }

    if (!location_id || !staff_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_required_fields" });
    }

    if (reservation_id) {
      const reservation = await prisma.reservations.findUnique({
        where: { id: reservation_id },
      });

      if (!reservation || reservation.location_id !== location_id) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: "reservation_not_found" });
      }

      if (TERMINAL_STATUSES.includes(reservation.reservation_status)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: `cannot_start_session_for_${reservation.reservation_status.toLowerCase()}_reservation`,
        });
      }

      if (reservation.staff_id !== staff_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "staff_not_assigned_to_this_reservation",
        });
      }
    }

    if (order_id) {
      const order = await prisma.orders.findUnique({
        where: { id: order_id },
      });

      if (!order || order.location_id !== location_id) {
        return res.status(StatusCodes.NOT_FOUND).json({ message: "order_not_found" });
      }

      if (TERMINAL_STATUSES.includes(order.order_status)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: `cannot_start_session_for_${order.order_status.toLowerCase()}_order`,
        });
      }

      if (order.staff_id !== staff_id) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "staff_not_assigned_to_this_order",
        });
      }
    }

    const sessionFilter: any = {
      staff_id,
      location_id,
      ended_at: null,
    };
    if (reservation_id) sessionFilter.reservation_id = reservation_id;
    if (order_id) sessionFilter.order_id = order_id;

    const existingSession = await prisma.active_service_session.findFirst({
      where: sessionFilter,
    });

    if (existingSession) {
      if (reservation_id) {
        const reservation = await prisma.reservations.findUnique({
          where: { id: reservation_id },
          include: { reservation_transaction: true },
        });

        if (reservation?.reservation_transaction?.payment_status !== "SUCCESS") {
          return res.status(StatusCodes.BAD_REQUEST).json({
            message: "cannot_complete_reservation_without_successful_payment",
          });
        }

        const updatedRes= await prisma.reservations.update({
          where: { id: reservation_id },
          data: { reservation_status: "COMPLETED" },
        });
        if(updatedRes) {
          is_completed = true;
        }
      }

      if (order_id) {
        const order = await prisma.orders.findUnique({
          where: { id: order_id },
        });

        if (order?.payment_status !== "SUCCESS") {
          return res.status(StatusCodes.BAD_REQUEST).json({
            message: "cannot_complete_order_without_successful_payment",
          });
        }

        const updatedOrder = await prisma.orders.update({
          where: { id: order_id },
          data: { order_status: "COMPLETED" },
        });
        if(updatedOrder) {
          is_completed = true;
        }
      }
     
      const ended = await prisma.active_service_session.update({
        where: { id: existingSession.id },
        data: { ended_at: new Date() },
        include: {
          staff: true,
          reservation: true,
          order: true,
          location: true,
        },
      });

      return res.status(StatusCodes.OK).json({
        message: "session_ended_and_status_updated",
        data: ended,
      });
    } else {
      const sessionData: any = {
        staff_id,
        location_id,
        started_at: new Date(),
      };

      if (reservation_id) sessionData.reservation_id = reservation_id;
      if (order_id) sessionData.order_id = order_id;

      const created = await prisma.active_service_session.create({
        data: sessionData,
        include: {
          staff: true,
          reservation: true,
          order: true,
          location: true,
        },
      });

      return res.status(StatusCodes.OK).json({
        message: "session_started",
        data: {...created, is_completed},
      });
    }
  } catch (error) {
    console.error("Service Session Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
