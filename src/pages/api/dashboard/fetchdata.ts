import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";

const fetchDashboardData = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const session = await validateAPI(
    req,
    res,
    true,
    ["Owner", "BackOfficeUser"],
    "POST"
  );
  if (!session) return;

  try {
    const location_id = session.user.selected_location_id;
    if (!location_id) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "location_id_is_required" });
    }
    const staffs = await prisma.user.findMany({
      where: {
        deleted_status: false,
        location_id,
        user_to_role: {
          some: {
            role: {
              name: "Staff",
            },
          },
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    });


    const categories = await prisma.categories.findMany({
      where: {
        location_id,
        deleted_status: false,
      },
      select: {
        id: true,
        name: true,
      },
    });
    const services = await prisma.services.findMany({
      where: {
        location_id,
        deleted_status: false,
      },
      select: {
        id: true,
        name: true,
        category_id: true,
      },
    });

    const location = await prisma.location.findUnique({
      where: {
        id: location_id,
      },
      select: {
        city: true,
        street: true,
        postcode: true,
        country: true,
      },
    });
    const address = `${location?.city}, ${location?.country}`;
    res.status(StatusCodes.OK).json({
      staffs,
      categories,
      services,
      address,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
};

export default fetchDashboardData;
