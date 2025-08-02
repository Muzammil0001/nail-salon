import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { handlePrismaError } from "../../../../lib/errorHandler";
import moment from "moment-timezone";

const formatDateInTimeZone = (date: Date | null, timeZone: string) => {
  if (date === null) {
    return "";
  }
  return moment(date)
    .tz(timeZone || "UTC")
    .format("DD/MM/YYYY HH:mm:ss");
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res
        .status(StatusCodes.METHOD_NOT_ALLOWED)
        .json({ error: "method_not_allowed" });
    }

    console.log(req.body);

    const {
      fetchAll = false,
      search,
      rowsPerPage = 10,
      currentPage = 0,
      timeZone,
    } = req.body;

    const searchQuery = search;

    let baseFilter: {
      deleted_status: boolean;
      company_id?: number | null;
    } = {
      deleted_status: false,
    };

    let users;
    let count = 0;

    if (fetchAll) {
      users = await prisma.user.findMany({
        where: baseFilter,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          username: true,
          email: true,
          created_at: true,
          last_login: true,
          active_status: true,
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
        orderBy: {
          first_name: "asc",
        },
      });
    } else {
      count = await prisma.user.count({
        where: {
          ...baseFilter,
          OR: [
            { first_name: { contains: searchQuery, mode: "insensitive" } },
            // { last_name: { contains: searchQuery, mode: 'insensitive' } },
            { username: { contains: searchQuery, mode: "insensitive" } },
            { email: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
      });

      users = await prisma.user.findMany({
        where: {
          ...baseFilter,
          OR: [
            { first_name: { contains: searchQuery, mode: "insensitive" } },
            { last_name: { contains: searchQuery, mode: "insensitive" } },
            { username: { contains: searchQuery, mode: "insensitive" } },
            { email: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          username: true,
          email: true,
          created_at: true,
          last_login: true,
          active_status: true,
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
        orderBy: {
          first_name: "asc",
        },
        take: rowsPerPage,
        skip: currentPage * rowsPerPage,
      });
    }

    const formattedUsers = users.map((user:any) => {
      const userTimeZone = timeZone || "UTC";

      return {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        username: user.username,
        email: user.email,
        created: formatDateInTimeZone(user.created_at, userTimeZone), // Format the created date
        lastLogin: formatDateInTimeZone(user.last_login, userTimeZone), // Format the last login date
        active_status: user.active_status,
        roles: user.user_to_role.map((utr:any) => utr.role.name),
      };
    });

    return res.status(StatusCodes.OK).json({
      message: "users_fetched_successfully",
      users: formattedUsers,
      count,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
