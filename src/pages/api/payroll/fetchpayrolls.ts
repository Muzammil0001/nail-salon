import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
  }

  try {
    let { location_id } = req.body;

    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "location_id_required" });
    }

    const payrolls = await prisma.payroll.findMany({
      where: {
        user: {
          location_id,
          deleted_status: false,
        },
      },
      select: {
        user_id: true,
        salary: true,
        hours: true,
        commission: true,
        tip_deduction: true,
        total: true,
        user: {
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
          },
        },
        payroll_payment: {
          orderBy: {
            paid_at: 'desc',
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
      orderBy: {
        user: {
          created_at: 'asc',
        },
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "payrolls_fetched",
      payrolls,
    });

  } catch (error) {
    console.error("Payroll Fetch Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
