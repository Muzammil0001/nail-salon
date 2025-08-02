import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import authMiddleware from "../../../../../lib/authMiddleware";
import { fileSaver } from "../../../../../lib/filesaver";

const updateProfile = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res
      .status(StatusCodes.METHOD_NOT_ALLOWED)
      .json({ message: "method_not_allowed" });
  }

  const user = await authMiddleware(req, res);
  if (!user) return;

  const { id: userId } = user;
  const { firstName, lastName, phone, image } = req.body;

  try {
    const existingUser = await prisma.customers.findFirst({
      where: { id: userId, deleted_status: false, is_verified:true },
    });

    if (!existingUser) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });
    }

    let savedImage = existingUser.image;

    if (image?.startsWith("data:image/")) {
      savedImage = await fileSaver(
        image,
        `${process.env.NEXT_PUBLIC_SHARED_IMG_DIR}/images/clients`
      );
    } else if (typeof image === "string") {
      savedImage = image;
    }

    const isChanged =
      firstName !== existingUser.firstname ||
      lastName !== existingUser.lastname ||
      phone !== existingUser.phone ||
      savedImage !== existingUser.image;

    if (!isChanged) {
      return res.status(StatusCodes.OK).json({
        message: "No changes detected",
        user: existingUser,
      });
    }

    const updatedUser = await prisma.customers.update({
      where: { id: userId },
      data: {
        firstname: firstName ?? existingUser.firstname,
        lastname: lastName ?? existingUser.lastname,
        phone: phone ?? existingUser.phone,
        image: savedImage ?? existingUser.image,
      },
    });

    const changes: string[] = [];
    if (firstName && firstName !== existingUser.firstname)
      changes.push(`first name to "${firstName}"`);
    if (lastName && lastName !== existingUser.lastname)
      changes.push(`last name to "${lastName}"`);
    if (phone && phone !== existingUser.phone)
      changes.push(`phone to "${phone}"`);
    if (savedImage && savedImage !== existingUser.image)
      changes.push(`profile image`);

    if (changes.length > 0) {
      await prisma.customer_activity_logs.create({
        data: {
          customer_id: userId,
          action: "profile_updated",
          details: `Updated ${changes.join(", ")}`,
        },
      });
    }

    return res.status(StatusCodes.OK).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[UpdateProfileError]", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Internal server error" });
  }
};

export default updateProfile;
