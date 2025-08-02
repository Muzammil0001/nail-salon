import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(StatusCodes.METHOD_NOT_ALLOWED)
      .json({ message: "method_not_allowed" });
  }

  try {
    const session = await validateAPI(
      req,
      res,
      true,
      ["Owner", "BackOfficeUser"],
      "POST"
    );

    const location_id = session?.user?.selected_location_id;

    if (!location_id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "location_id_required" });
    }

    const loyalty = await prisma.loyalty.findFirst({
      where: {
        location_id,
        deleted_status: false,
      },
    });

    if (!loyalty) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "loyalty_not_found" });
    }

    return res.status(StatusCodes.OK).json({ data: loyalty });
  } catch (error: any) {
    console.error("Get Loyalty Error:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
