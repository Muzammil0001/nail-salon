import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";

export default async function verifyUserOtp(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).end();
  }

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_required_fields" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email, deleted_status: false },
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "user_not_found" });
    }

    if (user.otp_code !== otp) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "invalid_otp" });
    }

    if (user.otp_expired_at && new Date() > user.otp_expired_at) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "otp_expired" });
    }

    return res.status(StatusCodes.OK).json({ message: "otp_verified" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
