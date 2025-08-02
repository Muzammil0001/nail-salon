import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    res.status(StatusCodes.METHOD_NOT_ALLOWED);
    return res.json({ error: "method_not_allowed" });
  }
  try {
    const { key } = req.body;
    if (!key) {
      res.status(StatusCodes.BAD_REQUEST);
      return res.json({ error: "key_is_required" });
    }
    const existingConfig = await prisma.configuration.findUnique({
      where: { key },
    });
    if (existingConfig) {
      res.status(StatusCodes.OK).json({ exists: true });
    } else {
      res.status(StatusCodes.OK).json({ exists: false });
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
};
export default handler;
