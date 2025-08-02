import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

const validPaymentStatuses = ["PENDING", "SUCCESS", "FAILED", "REFUNDED"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let {
      location_id,
      search = "",
      rowsPerPage = 25,
      page = 1,
      datetimeFilter,
      fetchAll = false,
    } = req.body;

    if (!location_id) {
      const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_location_id" });
    }

    const safePage = Math.max(1, Number(page));
    const safeLimit = Math.max(1, Number(rowsPerPage));

    const whereClause: any = {
      location_id,
      verified: true,
    };

    if (datetimeFilter?.from && datetimeFilter?.to) {
      const fromDate = new Date(datetimeFilter.from);
      const toDate = new Date(datetimeFilter.to);
      whereClause.created_at = {
        gte: fromDate,
        lte: toDate,
      };
    }

    if (search.trim()) {
      const q = search.trim();
      const qNum = parseInt(q, 10);
      const qUpper = q.toUpperCase();

      whereClause.OR = [];

      if (validPaymentStatuses.includes(qUpper)) {
        whereClause.OR.push({
          order_transaction: {
            payment_status: qUpper,
          },
        });
      }

      if (!isNaN(qNum)) {
        whereClause.OR.push({ order_number: qNum });
      }

      whereClause.OR.push(
        {
          customers: {
            firstname: {
              contains: q,
              mode: "insensitive",
            },
          },
        },
        {
          customers: {
            lastname: {
              contains: q,
              mode: "insensitive",
            },
          },
        }
      );

      whereClause.OR.push({
        order_transaction: {
          transaction_detail: {
            payment_method: {
              contains: q,
              mode: "insensitive",
            },
          },
        },
      });
    }

    const include = {
      customers: true,
      user: true,
      staff: true,
      extra_charges:true,
      order_details: true,
      order_transaction: {
        include: {
          transaction_detail: true,
        },
      },
    };

    const [orders, total] = await Promise.all([
      fetchAll
        ? prisma.orders.findMany({
            where: whereClause,
            include,
            orderBy: { created_at: "desc" },
          })
        : prisma.orders.findMany({
            where: whereClause,
            include,
            orderBy: { created_at: "desc" },
            skip: (safePage - 1) * safeLimit,
            take: safeLimit,
          }),
      prisma.orders.count({ where: whereClause }),
    ]);

    return res.status(StatusCodes.OK).json({ orders, count: total });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
