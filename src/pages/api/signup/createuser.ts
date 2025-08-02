import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { hashPassword } from "../../../../lib/authHelper";
import { v4 as uuidv4 } from "uuid";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, false, [], "POST");
    if (session) {
      const ownerRole = await prisma.role.findUnique({
        where: { name: "Owner" },
      });
      if (!ownerRole) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "owner_role_does_not_exist" });
      }

      const user = await prisma.user.create({
        data: {
          email: req.body.email,
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          username: req.body.username,
          password: await hashPassword(req.body.password),
          password_changed: true,
          shopper_reference: uuidv4(),
        },
      });

      await prisma.user_to_role.create({
        data: {
          user_id: user.id,
          role_id: ownerRole.id,
        },
      });

      res.status(StatusCodes.OK).json(user);
    }
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "internal_server_error" });
  }
}
