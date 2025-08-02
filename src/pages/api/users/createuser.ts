import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcrypt";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import { handlePrismaError } from "../../../../lib/errorHandler";
import validateAPI from "../../../../lib/valildateApi";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin", "Owner","BackOfficeUser"], "POST");
    if (!session) return;

    const {
      email,
      first_name,
      last_name,
      username,
      password,
      phone,
    } = req.body;

    const existingEmailUser = await prisma.user.findFirst({
      where: {
        email,
        deleted_status: false,
      },
    });

    if (existingEmailUser) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "email_already_exists" });
    }

    const existingUsernameUser = await prisma.user.findFirst({
      where: {
        username,
        deleted_status: false,
      },
    });

    if (existingUsernameUser) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "username_already_exists" });
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
    console.error("Error:", error);

    if (error instanceof PrismaClientKnownRequestError) {
      const { statusCode, message } = handlePrismaError(error);
      return res.status(statusCode).json({ message });
    }

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
