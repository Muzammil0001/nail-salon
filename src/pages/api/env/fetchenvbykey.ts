import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import redis from "../../../../lib/redis";
import prisma from "../../../../lib/prisma";
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(StatusCodes.METHOD_NOT_ALLOWED);
    return res.json({ error: "method_not_allowed" });
  }
  try {
    const { key } = req.body;
    const data = await prisma.configuration.findUnique({
      where: {
        key,
      },
    });
    try {
      await redis.set(`env_${data?.key}`, JSON.stringify(data));
    } catch (error) {}
    res.status(StatusCodes.OK);
    res.json(data);
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
};
export default handler;
