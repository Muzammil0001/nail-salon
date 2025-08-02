import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../../lib/prisma";
import validateAPI from "../../../../../lib/valildateApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== "POST") {
            return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({ message: "method_not_allowed" });
        }

        let { location_id, user_id, message, message_type = "info" } = req.body;

        if (!message) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_message" });
        }

        let session = null;

        if (!location_id || !user_id) {
            session = await validateAPI(req, res, true, ["Owner", "BackOfficeUser"], "POST");
            if (!session) return;
            if (!location_id) location_id = session.user.selected_location_id;
            if (!user_id) user_id = session.user.id;
        }

        if (!location_id || !user_id) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "missing_or_invalid_location_or_user" });
        }

        await prisma.activity_logs.create({
            data: {
                location_id,
                user_id,
                message,
                message_type,
            },
        });

        res.status(StatusCodes.CREATED).json({ message: "activity_log_created", activityLog: req.body });
    } catch (error) {
        console.error("Error creating activity log:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "internal_server_error" });
    }
}
