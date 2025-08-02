import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
const fetchNavigation = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const navigations = await prisma.navigation.findMany({});
    res.status(StatusCodes.OK).json({ Navigations: navigations });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
};
export default fetchNavigation;
