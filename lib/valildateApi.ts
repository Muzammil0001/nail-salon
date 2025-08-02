import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { StatusCodes } from "http-status-codes";
import { options } from "../src/pages/api/auth/[...nextauth]";

const validateAPI = async (
  req: NextApiRequest,
  res: NextApiResponse,
  validate_session: boolean,
  roles: string[],
  method: "GET" | "PUT" | "POST" | "DELETE"
) => {
  const session: any = await getServerSession(req, res, options);

  if (req.method === method && !validate_session) {
    return true;
  } else if (req.method !== method) {
    res.status(StatusCodes.METHOD_NOT_ALLOWED);
    res.json({ message: "method_not_allowed" });
  } else if (validate_session && !session) {
    res.status(StatusCodes.BAD_REQUEST);
    res.json({ message: "session_has_expired" });
  } else if (
    validate_session &&
    roles.length > 0 &&
    session?.user?.roles?.every((role: string) => !roles.includes(role))
  ) {
    res.status(StatusCodes.UNAUTHORIZED);
    res.json({ message: "you_are_not_authorized" });
  }

  return session;
};

export default validateAPI;
