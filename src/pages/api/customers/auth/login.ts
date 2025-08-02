import { generateToken } from './../../../../../lib/generateToken';
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";

export default async function login(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).end();
  }

  const { user, password } = req.body;

  if (!user) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "invalid_credential" });
  }

  try {
    const customer = await prisma.customers.findFirst({
      where: {
        OR: [{ username: user }, { email: user }],
        deleted_status: false,
        active_status: true,
        is_verified: true,
      },
    });

    if (!customer) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "customer_not_found" });
    }

    const valid = await bcrypt.compare(password, customer.password || "");
    if (!valid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "invalid_credentials" });
    }

    const token = generateToken(customer);

    return res.status(StatusCodes.OK).json({ token, customer });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
  }
}
