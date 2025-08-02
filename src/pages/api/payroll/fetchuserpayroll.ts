import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
  }

  try {
    let { user_id, location_id } = req.body;

    if (!user_id || typeof user_id !== "string") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_or_invalid_user_id",
      });
    }

    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    if (!location_id || typeof location_id !== "string") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "invalid_data_or_location",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: user_id,
        deleted_status: false,
        location_id,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        user_to_role: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        payroll: {
          select: {
            id: true,
            salary: true,
            hours: true,
            commission: true,
            tip_deduction: true,
            total: true,
            payroll_payment: {
              orderBy: {
                paid_at: "desc",
              },
              select: {
                id: true,
                pay_period_start: true,
                pay_period_end: true,
                worked_hours: true,
                per_hour_salary: true,
                commission: true,
                tip_deduction: true,
                net_salary: true,
                gross_salary: true,
                paid_at: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "user_not_found_or_deleted",
      });
    }

    return res.status(StatusCodes.OK).json({
      message: "payroll_payment_fetched_successfully",
      data: user,
    });
  } catch (error) {
    console.error("Payroll Payment Fetch Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
