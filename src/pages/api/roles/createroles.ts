import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "POST") {
      const { role_navigation } = req.body;

      await prisma.role_navigation.deleteMany({});

      await prisma.role_navigation.createMany({
        data: role_navigation,
        skipDuplicates: true,
      });

      return res
        .status(StatusCodes.OK)
        .json({ message: "role_navigation_saved_successfully" });
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
