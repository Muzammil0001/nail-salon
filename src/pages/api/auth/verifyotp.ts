// pages/api/verify-otp.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { StatusCodes } from 'http-status-codes';
import prisma from '../../../../lib/prisma';
import { handlePrismaError } from '../../../../lib/errorHandler';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res
        .status(StatusCodes.METHOD_NOT_ALLOWED)
        .json({ message: `method_not_allowed` });
    }

    const { email, code } = req.body;

    const existingOTP = await prisma.registration_otp.findUnique({
      where: { email },
    });

    if (
      !existingOTP ||
      existingOTP.used ||
      existingOTP.expires_at < new Date()
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'invalid_or_expired_otp' });
    }

    if (existingOTP.code !== code) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'incorrect_otp' });
    }

    await prisma.registration_otp.update({
      where: { email },
      data: { used: true },
    });

    return res
      .status(StatusCodes.OK)
      .json({ message: 'otp_verified_successfully' });
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      const { statusCode, message } = handlePrismaError(error);
      return res.status(statusCode).json({ message });
    }

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'internal_server_error' });
  }
}
