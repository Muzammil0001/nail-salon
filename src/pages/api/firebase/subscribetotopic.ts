import { NextApiRequest, NextApiResponse } from "next";
import { messaging } from "../../../../lib/firebaseHelper";
import validateAPI from "../../../../lib/valildateApi";
import { StatusCodes } from "http-status-codes";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const session = await validateAPI(req, res, false, [], "POST");
    if (!session) return;

    const response = await messaging.subscribeToTopic(
      [req.body.token],
      req.body.topic
    );

    res.status(StatusCodes.OK).json({ response });
  } catch (error) {
    console.error("Error subscribing to topic:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
};

export default handler;
