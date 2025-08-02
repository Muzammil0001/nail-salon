import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import { handlePrismaError } from "../../../../lib/errorHandler";
import prisma from "../../../../lib/prisma";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "POST") {
      const navigations = await prisma.navigation.findMany({});
      if(!navigations?.length){
        return res.status(StatusCodes.NOT_FOUND).json({ error:"navigations_not_found" });
      }
      return res.status(StatusCodes.OK).json({ navigations });
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
