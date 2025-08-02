import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";
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

    const {image, name, description, active_status } = req.body;

    if (!name || !description || !location_id || !client_id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "missing_required_fields",
      });
    }

    const existingCategory = await prisma.categories.findFirst({
      where: {
        location_id,
        name: {
          equals: name,
          mode: "insensitive",
        },
        deleted_status: false,
      },
    });

    if (existingCategory) {
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

    const maxSortOrder = await prisma.categories.aggregate({
      _max: { sort_order: true },
    });
    
    const newSortOrder = (maxSortOrder._max.sort_order ?? -1) + 1;

    const newCategory = await prisma.categories.create({
      data: {
        name,
        image: savedImage,
        description: description.trim(),
        active_status: !!active_status,
        location_id,
        client_id,
        sort_order:newSortOrder,
      },
    });

    return res.status(StatusCodes.CREATED).json({
      message: "category_created_successfully",
      category: newCategory,
    });
  } catch (error) {
    console.error("Category Create Error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
