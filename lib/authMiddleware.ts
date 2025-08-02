import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";

export default async function authMiddleware(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    return decoded as { id: string; email: string };
  } catch (err) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "invalid_token" });
  }
}
