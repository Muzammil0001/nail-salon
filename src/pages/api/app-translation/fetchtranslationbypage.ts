import { StatusCodes } from "http-status-codes";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { translationPages } from "../../../../lib/pages";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, false, [], "POST");

    if (!session) {
      return;
    }
    const translation = await prisma.translation_language.findFirst({
      where: {
        deleted_status: false,
        id: req.body.id,
      },
    });
    if (!translation) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "translation_not_found" });
    }
    const dbTranslationPage = await prisma.translation_page.findFirst({
      where: {
        translation_language_id: translation.id,
        page_name: req.body.page_name,
      },
      include: {
        translation_page_text: true,
      },
    });
    if (!dbTranslationPage) {
      const foundPage = translationPages.find(
        (page) => page.page_name === req.body.page_name
      );
      return res
        .status(foundPage ? StatusCodes.OK : StatusCodes.NOT_FOUND)
        .json(foundPage ? foundPage : { message: "page_not_found" });
    }

    const translations = [];
    for (const text of dbTranslationPage.translation_page_text) {
      const foundTranslation = dbTranslationPage.translation_page_text.find(
        (translation:any) => translation.text === text.text
      );

      if (foundTranslation) {
        translations.push({
          text: text.text,
          translation: foundTranslation.translation,
        });
      } else {
        translations.push(text);
      }
    }

    return res
      .status(StatusCodes.OK)
      .json({ ...dbTranslationPage, translation_page_text: translations });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR);
    res.json({ message: "internal_server_error" });
  }
}
