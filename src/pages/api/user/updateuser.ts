import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res
        .status(StatusCodes.METHOD_NOT_ALLOWED)
        .json({ message: "method_not_allowed" });
    }

    const { id, first_name, last_name, username, phone, password } = req.body;

    if (!id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "user_id_is_required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "user_not_found" });
    }

    let updateData: any = {
      first_name,
      last_name,
      username,
      phone,
    };

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return res
      .status(StatusCodes.OK)
      .json({ message: "user_updated_successfully" });

  } catch (error) {
    console.error(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
