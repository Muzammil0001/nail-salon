import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { otp } = req.body;

  if (!otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP are required" });
  }

  try {
    const user = await prisma.user.findFirst({ where: { otp_code: otp } });

    if (!user || !user.otp_code || !user.otp_expired_at) {
      return res
        .status(404)
        .json({ success: false, message: "OTP not found or expired" });
    }

    const now = new Date();
    const sentAt = new Date(user.otp_expired_at);
    const timeDiff = (now.getTime() - sentAt.getTime()) / 1000; // in seconds

    if (user.otp_code !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (timeDiff > 60) {
      return res.status(400).json({ success: false, message: "OTP expired" });
    }

    return res.status(200).json({ success: true, message: "OTP verified" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
