import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";

export default async function resetUserPassword(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).end();
  }

  const { email, newPassword, confirmPassword, otp } = req.body;

  if (!email || !newPassword || !confirmPassword || !otp) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_required_fields" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "passwords_do_not_match" });
  }

  try {
    const user = await prisma.user.findFirst({ where: { email, deleted_status: false } });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "user_not_found" });
    }

    if (user.otp_code !== otp || !user.otp_expired_at || new Date() > user.otp_expired_at) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "invalid_or_expired_otp" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        password_changed: true,
        otp_code: null,
        otp_expired_at: null,
      },
    });

    return res.status(StatusCodes.OK).json({ message: "password_reset_successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
