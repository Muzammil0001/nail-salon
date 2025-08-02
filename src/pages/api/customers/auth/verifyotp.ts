// pages/api/auth/verify-otp.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";

const OTP_EXPIRATION_TIME = 5 * 60 * 1000;

export default async function verifyOtp(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).end();
  }

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_required_fields" });
    }

    const customer = await prisma.customers.findFirst({ where: { email , deleted_status:false} });
    if (!customer) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "customer_not_found" });
    }

    const record = await prisma.customer_forgot_password.findFirst({
      where: { customer_id: customer.id, otp },
      orderBy: { created_at: "desc" },
    });

    if (!record) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "invalid_otp" });
    }

    const currentTime = new Date().getTime();
    const otpCreationTime = new Date(record.created_at).getTime();

    if (currentTime - otpCreationTime > OTP_EXPIRATION_TIME) {
      await prisma.customer_forgot_password.deleteMany({
        where: { customer_id: customer.id, otp },
      });
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "otp_expired" });
    }

    await prisma.customers.update({
      where: { id: customer.id },
      data: { is_verified: true },
    });

    return res.status(StatusCodes.OK).json({ message: "otp_verified" });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
