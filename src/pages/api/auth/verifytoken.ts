import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "token_is_required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    return res.status(StatusCodes.OK).json({
      valid: true,
      user: decoded,
    });
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "invalid_or_expired_token" });
  }
}
