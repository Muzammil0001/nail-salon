import { NextApiRequest, NextApiResponse } from "next";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../../lib/prisma";
import validateAPI from "../../../../lib/valildateApi";
import { randomBytes } from "crypto";
import sendEmail from "../../../../lib/sendEmail";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await validateAPI(req, res, true, [], "POST");
    if (!session) return;

    const {
      name,
      description,
      amount,
      number_of_times = 1,
      is_percentage = false,
      gift_code,
      expiry_date,
    } = req.body;

    if (!name || !amount || amount <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "name_and_amount_required",
      });
    }

    if (is_percentage && amount > 100) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "percentage_cannot_exceed_100",
      });
    }

    if (!gift_code || !/^[A-Z0-9]{4}$/.test(gift_code)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "invalid_gift_code",
      });
    }

    if (!session.user.selected_location_id || !session.user.id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "location_and_user_required",
      });
    }

    const finalGiftCode = gift_code;

    const giftCard = await prisma.gift_card.create({
      data: {
        card_code: finalGiftCode,
        name,
        description,
        amount,
        balance: amount,
        number_of_times,
        is_percentage,
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        location_id: session.user.selected_location_id as string,
        created_by: session.user.id as string,
      },
      include: {
        location: {
          select: { location_name: true },
        },
        created_by_user: {
          select: { first_name: true, last_name: true },
        },
      },
    });

    await prisma.gift_card_transaction.create({
      data: {
        gift_card_id: giftCard.id,
        transaction_type: "PURCHASE",
        amount,
        balance_before: 0,
        balance_after: amount,
        times_used_before: 0,
        times_used_after: 1,
        created_by: session.user.id,
      },
    });

    // ✉️ Fetch all active users
    const customers = await prisma.reservation_customer.findMany({
      where: {
        deleted_status: false,
        active_status: true,
      },
      select: {
        email: true,
        first_name: true,
      },
    });

    const discountInfo = is_percentage
      ? `${amount}% OFF`
      : `Flat discount of $${amount}`;

    const subject = `🎁 New Gift Card Available: ${discountInfo}`;
    const plainText = `We're excited to share a new gift card with you!\n\nName: ${name}\nDiscount: ${discountInfo}\nCode: ${finalGiftCode}\n${expiry_date ? "Valid Until: " + new Date(expiry_date).toLocaleDateString() : ""}\n\nUse this code during your next booking and enjoy the savings!`;

    const htmlBody = `
      <p>Hi there!</p>
      <p>We're excited to share a new <strong>gift card</strong> just for you:</p>
      <ul>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Discount:</strong> ${discountInfo}</li>
        <li><strong>Code:</strong> <code>${finalGiftCode}</code></li>
        ${
          expiry_date
            ? `<li><strong>Valid Until:</strong> ${new Date(
                expiry_date
              ).toLocaleDateString()}</li>`
            : ""
        }
      </ul>
      <p>Use this code during your next booking and enjoy the savings!</p>
      <p>Thank you for being part of our community.</p>
    `;

    for (const customer of customers) {
      try {
        await sendEmail(customer.email, subject, plainText, htmlBody);
        console.log(`Email sent to ${customer.email}`);
      } catch (err) {
        console.error(`Failed to send email to ${customer.email}:`, err);
      }
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "gift_card_created_successfully",
      giftCard,
    });
  } catch (error) {
    console.error("Error creating gift card:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "internal_server_error",
    });
  }
}
