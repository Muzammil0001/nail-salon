import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../../lib/prisma";
import authMiddleware from "../../../../../lib/authMiddleware";

const createActivityLog = async (req: NextApiRequest, res: NextApiResponse) => {

  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      message: "method_not_allowed",
    });
  }

  const user = await authMiddleware(req, res);
  if (!user) return;

  const { action, details } = req.body;

  if (!action || typeof action !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "missing_required_fields",
    });
  }

  try {
    const log = await prisma.customer_activity_logs.create({
      data: {
        customer_id: user.id,
        action,
        details: details || null,
      },
    });

    return res.status(StatusCodes.CREATED).json({
      message: "activity_log_created_successfully",
      log,
    });
  } catch (error) {
    console.error("Create Activity Log Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
};

export default createActivityLog;
