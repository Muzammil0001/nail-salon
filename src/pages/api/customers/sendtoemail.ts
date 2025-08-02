import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { clientQrCode } from "@/emailTemplates/clientQrCode";
import sendEmail from "../../../../lib/sendEmail";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(
      req,
      res,
      true,
      ["Owner", "BackOfficeUser"],
      "POST"
    );
    if (!session) {
      return;
    }

    const { id } = req.body;
    const customer = await prisma.customers.findFirst({
      where: {
        id,
        deleted_status: false,
      },
    });
    if (!customer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "customer_not_found",
      });
    }
    const html = await clientQrCode(
      customer.id,
      customer.firstname + " " + customer.lastname
    );
    sendEmail(customer.email as any, "Welcome to Our Platform!", "", html);

    return res.status(StatusCodes.OK).json({
      message: "customers_fetched_successfully",
    });
  } catch (error) {
    console.error("Error during the API request:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "internal_server_error",
    });
  }
}
