import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import sendEmail from "../../../../lib/sendEmail";
import { otpEmailTemplate } from "@/emailTemplates/sendOtpEmail";
import { generateOTP } from "../../../../lib/generateOTP";

export default async function sendUserOTP(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
  }

  const { email } = req.body;
  if (!email) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_required_fields" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email, deleted_status: false },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "user_not_found" });
    }

    const otp = generateOTP();
    const expiryDate = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp_code: otp,
        otp_expired_at: expiryDate,
      },
    });

    const html = otpEmailTemplate(user.first_name, otp);
    await sendEmail(user.email, "Your OTP Code", "", html);

    return res.status(StatusCodes.OK).json({ message: "otp_sent_successfully" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
