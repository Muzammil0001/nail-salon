import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { StatusCodes } from 'http-status-codes';
import prisma from '../../../../lib/prisma';
import { handlePrismaError } from '../../../../lib/errorHandler';

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

    const { email } = req.body;

    const existingOTP = await prisma.registration_otp.findUnique({
      where: { email },
    });

    if (
      existingOTP &&
      !existingOTP.used &&
      existingOTP.expires_at > new Date()
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({
          message: 'otp_already_active_please_wait_for_it_to_expire',
        });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationDuration = 1 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expirationDuration);

    await prisma.registration_otp.upsert({
      where: { email },
      update: {
        code,
        expires_at: expiresAt,
        used: false,
      },
      create: {
        code,
        email,
        expires_at: expiresAt,
        used: false,
      },
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is ${code}. It will expire in 1 minutes.`,
    });

    return res
      .status(StatusCodes.OK)
      .json({ message: 'otp_sent_to_your_email', code });
  } catch (error) {
   console.log("error:", error)
   
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'internal_server_error' });
  }
}
