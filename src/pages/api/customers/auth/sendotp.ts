import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import sendEmail from "../../../../../lib/sendEmail";
import { otpEmailTemplate } from "@/emailTemplates/sendOtpEmail";
import { generateOTP } from "../../../../../lib/generateOTP";

export default async function sendOTP(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      message: "method_not_allowed",
    });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "missing_required_fields",
    });
  }

  try {
    const customer = await prisma.customers.findFirst({
      where: {
        email,
        deleted_status: false,
      },
    });

    if (!customer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "customer_not_found",
      });
    }

    const otp:string = generateOTP();

    await prisma.customer_forgot_password.deleteMany({
      where: { customer_id: customer.id },
    });

   await prisma.customer_forgot_password.create({
      data: {
        customer_id: customer.id,
        otp,
      },
    });
    const html = otpEmailTemplate(customer.firstname, otp);

    await sendEmail(customer.email, "Your OTP Code", "", html);

    return res.status(StatusCodes.OK).json({
      message: "otp_sent_successfully",
    });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
