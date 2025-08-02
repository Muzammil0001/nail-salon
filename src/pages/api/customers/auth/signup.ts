import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import sendEmail from "../../../../../lib/sendEmail";
import { generateOTP } from "../../../../../lib/generateOTP";

export default async function signup(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).end();
  }

  const { firstName, lastName, email, phone, password, username, confirmPassword } = req.body;

  if (!firstName || !lastName || !email || !phone || !password || !username || !confirmPassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_fields" });
  }

  if (password !== confirmPassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "passwords_do_not_match" });
  }

  try {
    const verifiedEmailUser = await prisma.customers.findFirst({
      where: {
        email,
        is_verified: true,
        deleted_status: false,
      },
    });

    if (verifiedEmailUser) {
      return res.status(StatusCodes.CONFLICT).json({ message: "email_already_exists" });
    }

    const activeUsername = await prisma.customers.findFirst({
      where: {
        username,
        deleted_status: false,
      },
    });

    if (activeUsername) {
      return res.status(StatusCodes.CONFLICT).json({ message: "username_already_exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = await prisma.customers.create({
      data: {
        firstname: firstName,
        lastname: lastName,
        username,
        email,
        phone,
        password: hashedPassword,
        is_verified: false,
      },
    });

    const otp = generateOTP();
    await prisma.customer_forgot_password.create({
      data: {
        customer_id: customer.id,
        otp,
      },
    });

    const html = `<p>Your verification code is <strong>${otp}</strong>. It expires in 5 minutes.</p>`;
    await sendEmail(email, "Verify Your Email", "", html);

    return res.status(StatusCodes.CREATED).json({
      message: "signup_successful_otp_sent",
      customer_id: customer.id,
    });

  } catch (error: any) {
    console.error("Error during signup:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
      error: error.message || error,
    });
  }
}
