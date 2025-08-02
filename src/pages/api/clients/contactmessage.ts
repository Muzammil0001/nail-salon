import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import { StatusCodes } from "http-status-codes";
import sendEmail from "../../../../lib/sendEmail";
import { contactMessageTemplate } from "@/emailTemplates/contactMessageTemplate";

export default async function contactLocationOwner(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).json({
      message: "method_not_allowed",
    });
  }

  const { firstName, lastName, phone, email, address, message, location_id } =
    req.body;

  if (
    !firstName ||
    !lastName ||
    !phone ||
    !email ||
    !address ||
    !message ||
    !location_id
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "missing_required_fields",
    });
  }

  try {
    const location = await prisma.location.findUnique({
      where: { id: location_id },
    });

    if (!location || !location.location_email) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "something_went_wrong",
      });
    }

    const html = contactMessageTemplate(
      firstName,
      lastName,
      phone,
      email,
      address,
      message
    );

    await sendEmail(location.location_email, "New Customer Contact Message", "", html);

    return res.status(StatusCodes.OK).json({
      message: "query_sent_successfully",
    });
  } catch (error) {
    console.error("Error sending contact email:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
