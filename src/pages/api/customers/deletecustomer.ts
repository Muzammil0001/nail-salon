import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      message: "method_not_allowed",
    });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "customer_id_is_required",
      });
    }

    const customer = await prisma.customers.update({
      where: { id },
      data: {
        deleted_status: true,
      },
    });

    return res.status(StatusCodes.OK).json({
      customer,
      message: "customer_deleted_successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
