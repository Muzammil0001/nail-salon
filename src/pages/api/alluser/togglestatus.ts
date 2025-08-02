import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import { handlePrismaError } from "../../../../lib/errorHandler";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin"], "POST");
    if (!session) return;
    const { userId, status } = req.body;

    if (!userId || typeof status !== "boolean") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "missing_required_fields" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { active_status: status },
      select: {
        id: true,
        active_status: true,
      },
    });

    return res
      .status(StatusCodes.OK)
      .json({ message: "status_updated_successfully", user: updatedUser });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
