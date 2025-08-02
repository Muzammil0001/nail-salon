import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, true, ["SuperAdmin"], "POST");

    if (!session) {
      return;
    }
    let translationLanguage = await prisma.translation_language.findFirst({
      where: {
        language_id: req.body.language_id,
        deleted_status: false,
      },
    });
    if (!translationLanguage) {
      translationLanguage = await prisma.translation_language.create({
        data: {
          language_id: req.body.language_id,
        },
      });
    }
    await prisma.translation_page_text.deleteMany({
      where: {
        translation_page: {
          page_name: req.body.translation_page.page_name,
          translation_language_id: translationLanguage.id,
        },
      },
    });
    await prisma.translation_page.deleteMany({
      where: {
        page_name: req.body.translation_page.page_name,
        translation_language_id: translationLanguage.id,
      },
    });

    const translationPage = await prisma.translation_page.create({
      data: {
        page_name: req.body.translation_page.page_name,
        translation_language_id: translationLanguage.id,
      },
    });
    for (const text of req.body.translationPageTexts) {
      await prisma.translation_page_text.create({
        data: {
          text: text.text,
          translation: text.translation,
          translation_page_id: translationPage.id,
        },
      });
    }

    res.status(StatusCodes.OK);
    res.json(translationLanguage);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
