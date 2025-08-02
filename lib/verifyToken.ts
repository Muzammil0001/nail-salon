import jwt from "jsonwebtoken";
import prisma from "./prisma";
import { NextApiRequest } from "next";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function verifyTokenAndDevice(req: NextApiRequest): Promise<true> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("authorization_header_missing_or_invalid");
  }

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error("invalid_or_expired_token");
  }

  const { device_id, location_id } = req.body;

  if (!device_id || !location_id) {
    throw new Error("device_id_and_location_id_required");
  }

  const device = await prisma.device.findFirst({
    where: {
      device_id,
      location_id,
      deleted_status: false,
      active_status: true,
    },
  });

  if (!device) {
    throw new Error("invalid_device_or_location");
  }

  return true;
}
