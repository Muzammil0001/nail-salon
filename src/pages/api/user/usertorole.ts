import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .setHeader("Allow", ["POST"])
      .status(StatusCodes.METHOD_NOT_ALLOWED)
      .end(`method_not_allowed`);
  }
  try {
    const { userId, roleId } = req.body;
    if (!userId || !roleId) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "missing_userId_or_roleId" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "user_not_found" });
    }
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "role_not_found" });
    }
    const existingAssignment = await prisma.user_to_role.findFirst({
      where: {
        user_id: userId,
        role_id: roleId,
      },
    });
    if (existingAssignment) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "user_already_assigned_to_this_role" });
    }
    const userRole = await prisma.user_to_role.create({
      data: {
        user_id: userId,
        role_id: roleId,
      },
    });
    return res
      .status(StatusCodes.CREATED)
      .json({ message: "role_assigned_successfully", userRole });
  } catch (error) {
    console.error("Error assigning role:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
