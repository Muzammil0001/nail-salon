import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin"], "POST");
    if (session) {
      const { toInsert, toDelete } = req.body;

      for (const item of toDelete) {
        if (item.navId !== undefined && item.roleId !== undefined) {
          await prisma.role_navigation.deleteMany({
            where: {
              navigation_id: item.navId,
              role_id: item.roleId,
            },
          });
        }
        if (item.navId !== undefined && item.planId !== undefined) {
          await prisma.subscription_navigation.deleteMany({
            where: {
              navigation_id: item.navId,
              subscription_id: item.planId,
            },
          });
        }
      }

      for (const item of toInsert) {
        if (item.navId !== undefined && item.roleId !== undefined) {
          const foundNav = await prisma.role_navigation.findFirst({
            where: {
              navigation_id: item.navId,
              role_id: item.roleId,
            },
          });

          if (foundNav === null) {
            await prisma.role_navigation.create({
              data: {
                navigation_id: item.navId,
                role_id: item.roleId,
              },
            });
          }
        }
        if (item.navId !== undefined && item.planId !== undefined) {
          const foundNav = await prisma.subscription_navigation.findFirst({
            where: {
              navigation_id: item.navId,
              subscription_id: item.planId,
            },
          });

          if (foundNav === null) {
            await prisma.subscription_navigation.create({
              data: {
                navigation_id: item.navId,
                subscription_id: item.planId,
              },
            });
          }
        }
      }
      res.status(StatusCodes.OK).json({
        success: true,
        message: "role_navigation_updated_successfully",
      });
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
