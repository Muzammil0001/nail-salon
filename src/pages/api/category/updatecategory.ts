import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { fileSaver } from "../../../../lib/filesaver";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(
      req,
      res,
      true,
      ["Owner", "BackOfficeUser"],
      "POST"
    );

    if (!session) return;

    const { user } = session;
    const client_id = user.roles.includes("Owner") ? user.id : user.client_id;
    const location_id = session.user.selected_location_id;

    const { image, category_id, name, description, active_status } = req.body;

    if (!category_id || !name || !description || !location_id || !client_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_required_fields",
      });
    }

    const existingCategory = await prisma.categories.findFirst({
      where: {
        id: category_id,
        deleted_status: false,
      },
    });

    if (!existingCategory) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "category_not_found",
      });
    }

    const duplicateCategory = await prisma.categories.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
        location_id,
        deleted_status: false,
        NOT: {
          id: category_id,
        },
      },
    });

    if (duplicateCategory) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "entered_category_name_already_exists",
      });
    }

    const savedImage = image?.startsWith("data:image/")
    ? await fileSaver(
        image,
      `${process.env.NEXT_PUBLIC_SHARED_IMG_DIR}/images/clients`
      )
    : image || "placeholder.svg";
    const updatedCategory = await prisma.categories.update({
      where: { id: category_id },
      data: {
        name: name.trim(),
        image:savedImage || existingCategory.image,
        description: description.trim(),
        active_status: !!active_status,
        location_id,
        client_id,
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "category_updated_successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Category Update Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
