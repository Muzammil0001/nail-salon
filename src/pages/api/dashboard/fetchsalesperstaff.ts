import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";

const COLORS = {
  cash: "#00b788",
  card: "#1890ff",
  other: "#ffa800",
};

const fetchSalesPerStaff = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
  if (!session) return;

  const location_id = session.user.selected_location_id;
  if (!location_id) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "location_id_is_required" });
  }

  let { staff: staffId, paymentMethod, startDate, endDate } = req.body;
  if (paymentMethod === 'OTHER') { paymentMethod = 'QR' }
  try {
    const reservations = await prisma.reservations.findMany({
      where: {
        deleted_status: false,
        location_id,
        reservation_status: "COMPLETED",
        verified: true,
        ...(staffId && { staff_id: staffId }),
        ...(paymentMethod && {
          reservation_transaction: { is: { type: paymentMethod } },
        }),
        ...(startDate && endDate && {
          created_at: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        reservation_transaction: {
          select: {
            type: true,
            amount: true,
          },
        },
      },
    });

    let reservationTotals = { cash: 0, card: 0, other: 0 };

    reservations.forEach((resv) => {
      const tx = resv.reservation_transaction;
      if (tx) {
        switch (tx.type) {
          case "CASH":
            reservationTotals.cash += tx.amount;
            break;
          case "CARD":
            reservationTotals.card += tx.amount;
            break;
          default:
            reservationTotals.other += tx.amount;
        }
      }
    });

    const reservationTotal = reservationTotals.cash + reservationTotals.card + reservationTotals.other;

    const orders = await prisma.orders.findMany({
      where: {
        location_id,
        order_status: "COMPLETED",
        verified: true,
        ...(staffId && { staff_id: staffId }),
        ...(paymentMethod && {
          order_transaction: { is: { type: paymentMethod } },
        }),
        ...(startDate && endDate && {
          created_at: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      include: {
        order_transaction: {
          select: {
            type: true,
            amount: true,
          },
        },
      },
    });

    let orderTotals = { cash: 0, card: 0, other: 0 };

    orders.forEach((order) => {
      const tx = order.order_transaction;
      if (tx) {
        switch (tx.type) {
          case "CASH":
            orderTotals.cash += tx.amount;
            break;
          case "CARD":
            orderTotals.card += tx.amount;
            break;
          default:
            orderTotals.other += tx.amount;
        }
      }
    });

    const orderTotal = orderTotals.cash + orderTotals.card + orderTotals.other;

    const combinedTotals = {
      cash: reservationTotals.cash + orderTotals.cash,
      card: reservationTotals.card + orderTotals.card,
      other: reservationTotals.other + orderTotals.other,
    };

    const totalSum = combinedTotals.cash + combinedTotals.card + combinedTotals.other;

    const barChartData = {
      series: [
        { name: "Cash", data: [combinedTotals.cash], color: COLORS.cash },
        { name: "Card", data: [combinedTotals.card], color: COLORS.card },
        { name: "Other", data: [combinedTotals.other], color: COLORS.other },
      ],
      options: {
        xaxis: { categories: ["Total Sales"] },
      },
      total: totalSum,
    };

    const donutChartData = {
      series: [combinedTotals.cash, combinedTotals.card, combinedTotals.other],
      labels: ["Cash", "Card", "Other"],
      colors: [COLORS.cash, COLORS.card, COLORS.other],
    };

    const pointsData = [
      { name: "Cash", value: combinedTotals.cash, color: COLORS.cash },
      { name: "Card", value: combinedTotals.card, color: COLORS.card },
      { name: "Other", value: combinedTotals.other, color: COLORS.other },
    ];

    return res.status(StatusCodes.OK).json({
      barChartData,
      donutChartData,
      pointsData,
      totalSum,
      reservationTotal,
      orderTotal,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
};

export default fetchSalesPerStaff;
