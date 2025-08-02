import { StatusCodes } from 'http-status-codes';
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res
      .setHeader('Allow', ['GET'])
      .status(StatusCodes.METHOD_NOT_ALLOWED)
      .end(`method_not_allowed`);
  }
  try {
    const locationLanguage = await prisma.languages.findMany({
      where: {
        deleted_status: false,
      },
    });
    if (!locationLanguage) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: `language_not_found` });
    }
    res.status(StatusCodes.OK).json(locationLanguage);
  } catch (error) {
    console.error('Error fetching client language by ID:', error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: 'internal_server_error' });
  }
}
