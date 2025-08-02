import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const vatConfig = await prisma.configuration.findUnique({
      where: { key: "VAT" },
      select: { value: true }, // Only fetch the `value`
    });

    if (!vatConfig) {
      return res.status(404).json({ error: "VAT configuration not found" });
    }

    return res.status(200).json({ vat: vatConfig.value });
  } catch (error) {
    console.error("Error fetching VAT configuration:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
