import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "POST") {
      const roleNavigationData = await prisma.role_navigation.findMany();

      return res
        .status(StatusCodes.OK)
        .json({ role_navigation: roleNavigationData });
    } else {
      res.setHeader("Allow", ["POST"]);
      return res
        .status(StatusCodes.METHOD_NOT_ALLOWED)
        .json({ error: "method_not_allowed" });
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
