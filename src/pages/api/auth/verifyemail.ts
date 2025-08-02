import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import sendEmail from "../../../../lib/sendEmail";

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  try {
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }

    const otp = generateOTP();
    const now = new Date();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp_code: otp,
        otp_expired_at: now,
      },
    });

    await sendEmail(
      email,
      "Your OTP Code",
      `Your OTP code is ${otp}`,
      `<p>Your OTP code is <strong>${otp}</strong>. It is valid for 1 minute.</p>`
    );

    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error verifying email:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
