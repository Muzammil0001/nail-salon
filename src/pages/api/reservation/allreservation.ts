import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import moment from "moment";
import { reservation_status } from "@prisma/client";

const validReservationStatuses: reservation_status[] = [
  "PENDING",
  "CANCELED",
  "INCOMPLETE",
  "COMPLETED",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let {
      location_id,
      fetchAll = false,
      search = "",
      rowsPerPage = 25,
      page = 1,
      dateTime = { from: "", to: "" },
    } = req.body;

    let session = null;

    if (!location_id) {
      session = await validateAPI(
        req,
        res,
        true,
        ["Owner", "BackOfficeUser"],
        "POST"
      );
      if (!session) return;
      const { user } = session;
      location_id = user.selected_location_id;
    }

    rowsPerPage = Number(rowsPerPage);
    page = Number(page);
    const safePage = Math.max(page, 1);
    const safeRowsPerPage = Math.max(rowsPerPage, 25);

    const { from, to } = dateTime;

    const whereClause: any = {
      deleted_status: false,
      verified: true,
      location_id,
      reservation_date: {
        gte: moment().startOf("day").toDate(), 
      },
    };

    if (from && to) {
      whereClause.schedule_start_time = {
        gte: new Date(new Date(from).toISOString()),
        lte: new Date(new Date(to).toISOString()),
      };
    }

    if (search && search.trim() !== "") {
      const searchTrimmed = search.trim();
      const searchResStatusEnum = searchTrimmed.toUpperCase() as reservation_status;

      whereClause.OR = [];

      if (validReservationStatuses.includes(searchResStatusEnum)) {
        whereClause.OR.push({
          reservation_status: {
            equals: searchResStatusEnum,
          },
        });
      }

      const parsedNumber = parseInt(searchTrimmed);
      if (!isNaN(parsedNumber)) {
        whereClause.OR.push({
          reservation_number: {
            equals: parsedNumber,
          },
        });
      }

      whereClause.OR.push(
        {
          reservation_customer: {
            is: {
              first_name: {
                contains: searchTrimmed,
                mode: "insensitive",
              },
            },
          },
        },
        {
          reservation_customer: {
            is: {
              last_name: {
                contains: searchTrimmed,
                mode: "insensitive",
              },
            },
          },
        },
        {
          reservation_customer: {
            is: {
              email: {
                contains: searchTrimmed,
                mode: "insensitive",
              },
            },
          },
        },
        {
          reservation_transaction: {
            is: {
              transaction_detail: {
                is: {
                  payment_method: {
                    contains: searchTrimmed,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        },
        {
          reservation_transaction: {
            is: {
              transaction_detail: {
                is: {
                  stripe_status: {
                    contains: searchTrimmed,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        }
      );
    }

    const include = {
      staff: true,
      reservation_details: true,
      reservation_transaction: {
        include: {
          transaction_detail: true,
        },
      },
      reservation_customer: true,
      staff_tip: true,
    };

    const buildData = (items: any[]) =>
      items.map((r) => {
        const transaction = r.reservation_transaction ?? null;
        const staffTip = r.staff_tip;

        const checkAmount = staffTip?.check_amount ?? 0;
        const checkPaidAmount = staffTip?.check_paid_amount ?? 0;

        let checkFullyPaid = staffTip?.check_fully_paid ?? false;
        const checkRemainingAmount = checkAmount - checkPaidAmount;

        if (!checkFullyPaid && checkRemainingAmount <= 0 && checkAmount > 0) {
          checkFullyPaid = true;
        }

        return {
          id: r.id,
          customer_name: `${r.reservation_customer.first_name} ${r.reservation_customer.last_name ?? ""}`,
          date: r.reservation_date,
          start_time: session
            ? r.schedule_start_time
            : `${moment.utc(r.schedule_start_time).format("HH:mm")}`,
          last_time: session
            ? r.schedule_end_time
            : `${moment.utc(r.schedule_end_time).format("HH:mm")}`,
          price_total: r.price_total,
          reservation_number: r.reservation_number,
          staff: r.staff,
          status: r.reservation_status,
          details: r.reservation_details,
          transaction: r.reservation_transaction,
          payment_method: transaction?.type,
          payment_status: transaction?.payment_status,
          reservation_customer: r.reservation_customer,
          created_at: r.created_at,

          check_amount: checkAmount,
          check_paid_amount: checkPaidAmount,
          check_remaining_amount: Math.max(0, checkRemainingAmount),
          check_fully_paid: checkFullyPaid,
        };
      });

    if (fetchAll) {
      const allReservations = await prisma.reservations.findMany({
        where: whereClause,
        orderBy: {
          created_at: "desc",
        },
        include,
      });

      return res.status(StatusCodes.OK).json({
        message: "reservations_fetched_successfully",
        data: buildData(allReservations),
        total: allReservations.length,
      });
    }

    const total = await prisma.reservations.count({ where: whereClause });

    const reservations = await prisma.reservations.findMany({
      where: whereClause,
      skip: (safePage - 1) * safeRowsPerPage,
      take: safeRowsPerPage,
      orderBy: {
        created_at: "desc",
      },
      include,
    });

    return res.status(StatusCodes.OK).json({
      message: "reservations_fetched_successfully",
      data: buildData(reservations),
      count: total,
      currentPage: safePage,
      rowsPerPage: safeRowsPerPage,
    });
  } catch (error) {
    console.error("Fetch Reservations Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
