import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
        message: "method_not_allowed",
      });
    }

    let {
      user_id,
      location_id,
      fetchAll = false,
      search = "",
      rowsPerPage = 25,
      page = 1,
    } = req.body;

    let session = null;

    if (!location_id) {
      session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;

      const { user } = session;
      location_id = user.selected_location_id;
    }

    if (!location_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_location_id",
      });
    }

    if (!user_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_user_id",
      });
    }

    const existingCustomer = await prisma.customers.findUnique({
      where: { id: user_id },
    });

    const existingAdminUser = !existingCustomer
      ? await prisma.user.findUnique({ where: { id: user_id } })
      : null;

    if (!existingCustomer && !existingAdminUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "user_not_found",
      });
    }

    const safeRowsPerPage = Math.max(Number(rowsPerPage), 25);
    const safePage = Math.max(Number(page), 1);

    const customer = await prisma.customers.findUnique({ where: { id: user_id } });
    const adminUser = !customer
      ? await prisma.user.findUnique({ where: { id: user_id } })
      : null;

    if (!customer && !adminUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "user_not_found",
      });
    }

    const isCustomer = !!customer;

    const baseWhere: any = {
      location_id,
      ...(isCustomer
        ? { customer_id: user_id }
        : { user_id: user_id }),
      ...(search
        ? {
          OR: [
            { customers: { firstname: { contains: search, mode: "insensitive" } } },
            { customers: { lastname: { contains: search, mode: "insensitive" } } },
            { user: { first_name: { contains: search, mode: "insensitive" } } },
            { user: { last_name: { contains: search, mode: "insensitive" } } },
          ],
        }
        : {}),
    };

    const baseQuery = {
      where: baseWhere,
      orderBy: {
        created_at: "desc" as const,
      },
      include: {
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
      },
    };

    let orders;

    if (fetchAll) {
      orders = await prisma.orders.findMany(baseQuery);
    } else {
      orders = await prisma.orders.findMany({
        ...baseQuery,
        skip: (safePage - 1) * safeRowsPerPage,
        take: safeRowsPerPage,
      });
    }

    const totalOrders = await prisma.orders.count({
      where: baseWhere,
    });

    return res.status(StatusCodes.OK).json({
      orders,
      count: totalOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
