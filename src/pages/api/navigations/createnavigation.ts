import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import validateAPI from "../../../../lib/valildateApi";

const createNavigation = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin"], "POST");
    if (!session) {
      return;
    }
    const { data } = req.body;

    if (
      !Array.isArray(data) ||
      !data.every((item) => item.title && item.href)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error:
          "invalid_input_data_format_in_item",
      });
    }

    const parentIds = data
      .map((item) => item.parentId)
      .filter((id) => id !== null && id !== undefined);

    if (parentIds.length > 0) {
      const parentNavigations = await prisma.navigation.findMany({
        where: { id: { in: parentIds } },
        select: { id: true },
      });

      const existingParentIds = new Set(parentNavigations.map((nav:any) => nav.id));
      const invalidParentIds = parentIds.filter(
        (id) => !existingParentIds.has(id)
      );

      if (invalidParentIds.length > 0) {
        return res.status(StatusCodes.NOT_FOUND).json({
          error: `parent_navigation_items_with_given_ids_not_found`,
        });
      }
    }

    const navigationItems = data.map((item) => ({
      title: item.title,
      href: item.href,
      icon: item.icon || null,
      parentId: item.parentId || null,
    }));

    const createdNavigationItems = await prisma.navigation.createMany({
      data: navigationItems,
    });

    console.log(createdNavigationItems);

    return res.status(StatusCodes.CREATED).json({
      message: "navigation_items_created_successfully",
      count: createdNavigationItems.count,
    });
  } catch (error) {
    console.error("Error in creating navigation items:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
};

export default createNavigation;
