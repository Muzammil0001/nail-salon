import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { StatusCodes } from 'http-status-codes';
import { handlePrismaError } from '../../../../lib/errorHandler';
import sendEmail from '../../../../lib/sendEmail';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      return res
        .status(StatusCodes.METHOD_NOT_ALLOWED)
        .json({ message: 'method_not_allowed' });
    }

    const { id, old_pin, new_pin, confirm_pin } = req.body;

    if (!id || !old_pin || !new_pin || !confirm_pin) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({
          message:
            'missing_required_fields',
        });
    }

    if (new_pin !== confirm_pin) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'new_pin_and_confirm_pin_do_not_match' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: 'user_not_found' });
    }

    if (user.pin !== old_pin) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: 'old_pin_is_incorrect' });
    }

    const currentPinUsage = await prisma.user.findFirst({
      where: {
        location_id: user.location_id,
        pin: `${new_pin}`,
        deleted_status: false,
      },
    });
    if (currentPinUsage !== null) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'pin_already_in_use' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        pin: `${new_pin}`,
        password_changed: true,
      },
    });

    if (user.email) {
      await sendEmail(
        user.email,
        'PIN Change Confirmation',
        `Hello ${user.first_name || 'User'},\n\nYour PIN has been successfully updated.\n\nIf you did not make this change, please contact support immediately.`,
        `<p>Hello <strong>${user.first_name || 'User'}</strong>,</p>
         <p>Your PIN has been successfully updated.</p>`
      );
    }

    return res
      .status(StatusCodes.OK)
      .json({ message: 'pin_updated_successfully' });
  } catch (error) {
    const errorResponse = handlePrismaError(error);
    return res
      .status(errorResponse.statusCode)
      .json({ message: errorResponse.message });
  }
}
