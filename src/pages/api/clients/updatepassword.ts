import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { hashPassword, verifyPassword } from "../../../../lib/authHelper";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, true, [], "POST");
    if (session) {
      const user_id = session?.user?.id;
      console.log(user_id);
      const user = await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
      });
      if (!user) {
        res.status(StatusCodes.BAD_REQUEST);
        return res.json({ message: "user_not_found" });
      }

      if (
        !(await verifyPassword(
          req.body.current_password,
          user.password as string
        ))
      ) {
        res.status(StatusCodes.BAD_REQUEST);
        return res.json({ message: "invalid_password" });
      }
      if (req.body.new_password !== req.body.confirm_password) {
        res.status(StatusCodes.BAD_REQUEST);
        return res.json({ message: "passwords_do_not_match" });
      }
      if (req.body.new_password.length < 8) {
        res.status(StatusCodes.BAD_REQUEST);
        return res.json({ message: "password_too_short" });
      }
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          password: await hashPassword(req.body.new_password),
          password_changed: true,
        },
      });
      res.status(StatusCodes.CREATED);
      res.json({ message: "password_updated_successfully" });
    }
  } catch (error) {
    console.log(error, "error");
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
