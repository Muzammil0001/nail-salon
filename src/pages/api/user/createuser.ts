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
        .json({ message: `method_not_allowed` });
    }

    const {
      email,
      first_name,
      last_name,
      username,
      password,
      phone,
    } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "user_with_this_username_already_exists" });
    }

    const otp = await prisma.registration_otp.findUnique({
      where: { email },
    });

    if (!otp || !otp.used) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "otp_has_not_been_verified_or_is_invalid" });
    }

    const ownerRole = await prisma.role.findUnique({
      where: { name: "Owner" },
    });
    if (!ownerRole) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "owner_role_does_not_exist" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        first_name,
        last_name,
        username,
        password: hashedPassword,
        phone,
        user_main: true,
        billing_model: "YEARLY",
      },
    });

    return res
      .status(StatusCodes.CREATED)
      .json({ message: "user_created_successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
