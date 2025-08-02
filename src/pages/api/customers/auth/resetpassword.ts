import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";

const OTP_EXPIRATION_TIME = 5 * 60 * 1000; 
export default async function resetPassword(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).end();
  }

  const { email, newPassword, confirmPassword, otp } = req.body;

  if (!email || !newPassword || !confirmPassword || !otp) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "email_password_otp_required",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "passwords_do_not_match",
    });
  }
                                                       
  try {
    const customer = await prisma.customers.findFirst({ where: { email, deleted_status:false } });
    if (!customer) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "customer_not_found" });
    }

    const latestOtpRecord = await prisma.customer_forgot_password.findFirst({
      where: { customer_id: customer.id },
      orderBy: { created_at: "desc" },
    });

    if (!latestOtpRecord) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "otp_not_found" });
    }

    const currentTime = Date.now();
    const otpCreationTime = new Date(latestOtpRecord.created_at).getTime();

    if (currentTime - otpCreationTime > OTP_EXPIRATION_TIME) {
      await prisma.customer_forgot_password.deleteMany({
        where: { customer_id: customer.id },
      });
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "otp_expired" });
    }

    if (otp !== latestOtpRecord.otp) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "invalid_or_expired_otp" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.customers.update({
      where: { id: customer.id , deleted_status:false, is_verified:true},
      data: { password: hashedPassword },
    });

    await prisma.customer_activity_logs.create({
      data: {
        customer_id: customer.id,
        action: "password_reset",
        details: "Customer successfully reset their password.",
      },
    });


    return res.status(StatusCodes.OK).json({ message: "password_reset_successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
