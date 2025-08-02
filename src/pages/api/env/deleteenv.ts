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
    const { id } = req.body;

    // console.log(id);
    if (!id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "configuration_id_is_required" });
    }
    const deletedconfig = await prisma.configuration.delete({
      where: { id: id },
    });
    return res.status(StatusCodes.OK).json({
      message: "configuration_deleted_successfully",
      deletedconfig,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
