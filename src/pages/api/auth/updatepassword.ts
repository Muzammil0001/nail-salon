import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { hashPassword } from "../../../../lib/authHelper";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Email and new password are required" });
  }

  try {
    // Find the user by email
    const user = await prisma.user.findFirst({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password in the database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp_code: null, // Clear OTP
        otp_expired_at: null, // Clear OTP timestamp
        password_changed: true,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
