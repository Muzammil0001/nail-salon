import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      message: "method_not_allowed",
    });
  }

  try {
    let {
      location_id,
      search = "",
      page = 1,
      rowsPerPage = 25,
      fetchAll = false,
    } = req.body;

    let session = null;

    if (!location_id) {
      session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
      if (!session) return;
      location_id = session.user.selected_location_id;
    }

    page = Number(page);
    rowsPerPage = Number(rowsPerPage);
    const safePage = Math.max(page, 1);
    const safeRowsPerPage = Math.max(rowsPerPage, 1);

    const whereClause: any = {
      deleted_status: false,
    };

    if (search.trim() !== "") {
      const searchTerm = search.trim();
      whereClause.OR = [
        { first_name: { contains: searchTerm, mode: "insensitive" } },
        { last_name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { phone: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const loyaltyConfig = await prisma.loyalty.findFirst({
      where: { location_id, deleted_status: false },
    });

    if (!loyaltyConfig) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "loyalty_configuration_not_found",
      });
    }

    const customers = await prisma.reservation_customer.findMany({
      where: whereClause,
      skip: fetchAll ? undefined : (safePage - 1) * safeRowsPerPage,
      take: fetchAll ? undefined : safeRowsPerPage,
      orderBy: {
        created_at: "desc",
      },
    });

    const now = new Date();

    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const history = await prisma.loyalty_history.findMany({
          where: {
            user_id: customer.id,
            location_id,
          },
        });

        const totalEarned = history
          .filter(entry => entry.type === "EARNED" && (!entry.expires_at || entry.expires_at > now))
          .reduce((sum, entry) => sum + entry.points, 0);

        const totalRedeemed = history
          .filter(entry => entry.type === "REDEEMED")
          .reduce((sum, entry) => sum + entry.points, 0);

        const availablePoints = Math.max(totalEarned - totalRedeemed, 0);

        await prisma.user_loyalty.upsert({
          where: { user_id: customer.id },
          update: { points: availablePoints },
          create: {
            user_id: customer.id,
            points: availablePoints,
          },
        });

        return {
          id: customer.id,
          name: `${customer.first_name} ${customer.last_name || ""}`.trim(),
          email: customer.email,
          phone: customer.phone,
          loyalty_points: availablePoints,
        };
      })
    );

    const totalCount = await prisma.reservation_customer.count({ where: whereClause });

    return res.status(StatusCodes.OK).json({
      message: "customers_fetched_successfully",
      customers: enrichedCustomers,
      count: totalCount,
      currentPage: safePage,
      rowsPerPage: safeRowsPerPage,
    });
  } catch (error) {
    console.error("Fetch Customers Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
