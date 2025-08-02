import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
  }

  try {
    let { location_id, payload } = req.body;

    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    if (!location_id || !Array.isArray(payload)) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "invalid_data_or_location" });
    }

    const createdPayrolls = [];

    for (const entry of payload) {
      const { salary, hours, commission, user_id, tip_deduction, total } = entry;

      if (!user_id || salary == null || hours == null || tip_deduction === null) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: "missing_required_fields",
        });
      }

      const user = await prisma.user.findFirst({
        where: { id: user_id, deleted_status: false },
      });

      if (!user) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "user_not_found_or_deleted",
          user_id,
        });
      }

      const updated = await prisma.payroll.upsert({
        where: { user_id },
        update: {
          salary: parseFloat(salary),
          hours: parseFloat(hours),
          commission: commission ? parseFloat(commission) : 0,
          tip_deduction: tip_deduction ? parseFloat(tip_deduction) : 0,
          total: total ? parseFloat(total) : undefined,
        },
        create: {
          user_id,
          salary: parseFloat(salary),
          hours: parseFloat(hours),
          commission: commission ? parseFloat(commission) : 0,
          tip_deduction: tip_deduction ? parseFloat(tip_deduction) : 0,
          total: total ? parseFloat(total) : undefined,
        },
      });

      createdPayrolls.push(updated);
    }

    return res.status(StatusCodes.OK).json({
      message: "saved!",
      createdPayrolls,
    });
  } catch (error) {
    console.error("Payroll Save Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
