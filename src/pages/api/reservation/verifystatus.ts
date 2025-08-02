import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import {transaction_type} from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        message: "Method not allowed",
      });
    }

    const reservationId = req.body.id as string;

    if (!reservationId) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_reservation_id" });
    }

    const reservation = await prisma.reservations.findFirst({
      where: {
        id: reservationId,
        reservation_transaction: {
          type: {
            not: 'QR' as transaction_type,
          },
        },
      },
      select: {
        verified: true,
      },
    });
    
    

    if (!reservation) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "reservation_not_found" });
    }

    return res.status(StatusCodes.OK).json({
      message: "reservation_found",
      verified: reservation.verified,
    });
  } catch (error) {
    console.error("Error checking reservation verification:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
      error: error instanceof Error ? error.message : error,
    });
  }
}
