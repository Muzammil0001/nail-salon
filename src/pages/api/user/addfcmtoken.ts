import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "POST") {
      const { id, fcm_token } = req.body;

      if (!id || !fcm_token) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "id_and_fcm_token_are_required" });
      }
      const exisitingUser = await prisma.user.findUnique({ where: { id } })
      if (!exisitingUser) {
          return res
              .status(StatusCodes.NOT_FOUND)
              .json({ error: "user_not_found" });
      }
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { fcm_token },
      });

      return res.status(StatusCodes.OK).json({
        message: "FCM_token_updated_successfully",
        user: {
          id: updatedUser.id,
          fcm_token: updatedUser.fcm_token,
        },
      });
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
