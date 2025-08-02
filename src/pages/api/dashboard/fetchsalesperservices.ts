import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";
import { generateRandomColor } from "../../../../lib/extras";

const fetchSalesPerServices = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
  if (!session) return;

  try {
    const location_id = session.user.selected_location_id;
    if (!location_id) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "location_id_is_required" });
    }

    const { startDate, endDate, services = [], categories = [] } = req.body;

    const dateFilter =
      startDate && endDate
        ? {
            created_at: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {};

    const reservationFilter: any = {
      deleted_status: false,
      reservation_status: "COMPLETED",
      verified: true,
      location_id,
      ...dateFilter,
    };

    const orderFilter: any = {
      order_status: "COMPLETED",
      verified: true,
      location_id,
      ...dateFilter,
    };

    const serviceCondition = services.length > 0;
    const categoryCondition = categories.length > 0;

    if (serviceCondition) {
      reservationFilter.reservation_details = {
        some: { service_id: { in: services } },
      };
      orderFilter.order_details = {
        some: { item_id: { in: services } },
      };
    }

    const reservationData = await prisma.reservations.findMany({
      where: reservationFilter,
      include: {
        reservation_details: {
          include: {
            service: {
              include: {
                categories: true,
              },
            },
          },
        },
      },
    });

    const orderData = await prisma.orders.findMany({
      where: orderFilter,
      include: {
        order_details: true,
      },
    });

    const salesData: Record<string, number> = {};

    reservationData.forEach((reservation) => {
      reservation.reservation_details.forEach((detail) => {
        const { service, service_price, quantity } = detail;

        if (!service) return;
        if (serviceCondition && !services.includes(service.id)) return;
        if (categoryCondition && !categories.includes(service.category_id)) return;

        const label = serviceCondition
          ? service.name
          : categoryCondition
          ? service.categories?.name
          : service.name;

        if (!label) return;

        const totalSale = service_price * quantity;
        salesData[label] = (salesData[label] || 0) + totalSale;
      });
    });

    orderData.forEach((order) => {
      order.order_details.forEach((detail) => {
        if (serviceCondition && !services.includes(detail.item_id)) return;

        const label = detail.item_name;
        const totalSale = detail.item_price * detail.quantity;
        salesData[label] = (salesData[label] || 0) + totalSale;
      });
    });

    const sortedEntries = Object.entries(salesData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const limitedSalesData = Object.fromEntries(sortedEntries);
    const names = Object.keys(limitedSalesData);

    const colors = names.reduce((acc: Record<string, string>, name) => {
      acc[name] = generateRandomColor();
      return acc;
    }, {});

    const total = Object.values(limitedSalesData).reduce((sum, val) => sum + val, 0);

    const barChartData = {
      series: [
        {
          data: names.map((name) => ({
            x: name,
            y: parseFloat(limitedSalesData[name].toFixed(2)),
            fillColor: colors[name],
          })),
        },
      ],
      options: {
        xaxis: {
          categories: names,
        },
      },
      colors: names.map((name) => colors[name]),
      total: parseFloat(total.toFixed(2)),
    };

    const donutChartData = {
      series: names.map((name) => parseFloat(limitedSalesData[name].toFixed(2))),
      colors: names.map((name) => colors[name]),
      labels: names,
    };

    const pointsData = names.map((name) => ({
      name,
      value: parseFloat(limitedSalesData[name].toFixed(2)),
      color: colors[name],
    }));

    res.status(StatusCodes.OK).json({ barChartData, donutChartData, pointsData });
  } catch (error) {
    console.error("Sales service fetch error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
};

export default fetchSalesPerServices;
