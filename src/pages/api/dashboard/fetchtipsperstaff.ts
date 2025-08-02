import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";

const colors = {
  CASH: "#00b788",
  CARD: "#1890ff",
  OTHER: "#ffa800",
};

const fetchTipsPerStaff = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
  if (!session) return;

  try {
    const location_id = session.user.selected_location_id;
    if (!location_id) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "location_id_is_required" });
    }

    let { staff, startDate, endDate, paymentMethod } = req.body;
    if (paymentMethod === 'OTHER') { paymentMethod = 'QR' }
    const dateFilter =
      startDate && endDate
        ? {
            gte: new Date(startDate),
            lte: new Date(endDate),
          }
        : undefined;

    const staffTipFilter: any = {
      tip_type: "CASH",
      staff: { is: { location_id } },
    };

    if (staff) staffTipFilter.user_id = staff;
    if (dateFilter) staffTipFilter.created_at = dateFilter;

    const staffTips = await prisma.staff_tip.findMany({
      where: staffTipFilter,
      select: {
        cash_amount: true,
        tip: true,
      },
    });

    let cashTipTotal = 0;
    for (const tip of staffTips) {
      cashTipTotal += tip.cash_amount ?? tip.tip ?? 0;
    }

    const orderFilter: any = {
      verified: true,
      order_status: "COMPLETED",
      payment_status: "SUCCESS",
      location_id,
      tip: { gt: 0 },
    };

    if (staff) orderFilter.staff_id = staff;
    if (dateFilter) orderFilter.created_at = dateFilter;
    if (paymentMethod) orderFilter.payment_method = paymentMethod.toUpperCase();

    const orderTips = await prisma.orders.findMany({
      where: orderFilter,
      select: {
        tip: true,
        payment_method: true,
      },
    });

    const tipTotals = {
      CASH: cashTipTotal,
      CARD: 0,
      OTHER: 0,
    };

    for (const order of orderTips) {
      const type = order.payment_method?.toUpperCase() ?? "OTHER";
      if (type === "CASH" || type === "CARD") {
        tipTotals[type] += order?.tip ?? 0;
      } else {
        tipTotals.OTHER += order?.tip ?? 0;
      }
    }

    const total = tipTotals.CASH + tipTotals.CARD + tipTotals.OTHER;

    const barChartData = {
      series: [
        { name: "Cash", data: [tipTotals.CASH], color: colors.CASH },
        { name: "Card", data: [tipTotals.CARD], color: colors.CARD },
        { name: "Other", data: [tipTotals.OTHER], color: colors.OTHER },
      ],
      options: {
        xaxis: { categories: ["Total Tips"] },
      },
      total: parseFloat(total.toFixed(2)),
    };

    const donutChartData = {
      series: [
        parseFloat(tipTotals.CASH.toFixed(2)),
        parseFloat(tipTotals.CARD.toFixed(2)),
        parseFloat(tipTotals.OTHER.toFixed(2)),
      ],
      labels: ["Cash", "Card", "Other"],
      colors: [colors.CASH, colors.CARD, colors.OTHER],
    };

    const pointsData = [
      { name: "Cash", value: parseFloat(tipTotals.CASH.toFixed(2)), color: colors.CASH },
      { name: "Card", value: parseFloat(tipTotals.CARD.toFixed(2)), color: colors.CARD },
      { name: "Other", value: parseFloat(tipTotals.OTHER.toFixed(2)), color: colors.OTHER },
    ];

    return res.status(StatusCodes.OK).json({ barChartData, donutChartData, pointsData });
  } catch (error) {
    console.error("Fetch Tips Error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
};

export default fetchTipsPerStaff;
