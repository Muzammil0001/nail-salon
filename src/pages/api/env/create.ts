import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(StatusCodes.METHOD_NOT_ALLOWED);
    return res.json({ error: "method_not_allowed" });
  }
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin"], "POST");
    if (session) {
      const {
        key,
        value,
        description,
        is_visible,
        is_editable,
        createdBy,
      } = req.body;

      const configrationExists = await prisma.configuration.findFirst({
        where: {
          key,
          deleted_status: false,
        },
      });

      if (configrationExists) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "the_confirmation_has_already_been_created",
        });
      }

      const data = await prisma.configuration.create({
        data: {
          key,
          value,
          description,
          is_visible,
          is_editable,
          createdBy: session.user.id,
        },
      });
      res.status(StatusCodes.OK);
      res.json({data, message:"environment_created"});
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
};
export default handler;
