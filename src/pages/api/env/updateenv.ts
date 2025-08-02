import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { deleteRedisKey } from "../../../../lib/redisHelper";
import validateAPI from "../../../../lib/valildateApi";
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin"], "POST");
    if (session) {
      const { id, key, value, description, is_visible, is_editable } = req.body;
      const toEdit = await prisma.configuration.findUnique({
        where: {
          id: id,
        },
      });
      if (!toEdit) {
        res.status(StatusCodes.NOT_FOUND);
        return res.json({ error: "invalid_configuration_id" });
      }
      if (!toEdit?.is_editable) {
        res.status(StatusCodes.BAD_REQUEST);
        return res.json({ error: "configuration_is_not_editable" });
      }
      const data = await prisma.configuration.update({
        where: {
          id: id,
        },
        data: {
          key,
          value,
          description,
          is_visible,
          is_editable,
        },
      });
      try {
        await deleteRedisKey(`env_${key}`);
      } catch (error) {}
      res.status(StatusCodes.OK);
      res.json(data);
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
};
export default handler;
