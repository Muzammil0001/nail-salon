import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin"], "POST");
    if (session) {
      const navigations = await prisma.navigation.findMany({
        where: {
          href: {
            notIn: [
              "/configuration",
              "/allergens",
              "/all_user",
              "/roles",
              "/subscriptionNavigation",
              "/announcements",
              "/subscription",
              "/clients",
              "/appversions",
              "/app-translation",
              "/catalog_section",
              "/catalog_category",
              "/catalog_products",
              "/catalog_images",
              "/item-admin",
              "/supplier-admin",
              "/tutorials",
            ],
          },
        },
      });

      res.status(StatusCodes.OK);
      res.json({
        navigations,
      });
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
