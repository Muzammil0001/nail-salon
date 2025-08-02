import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { StatusCodes } from 'http-status-codes';
import QRCode from 'qrcode';
import prisma from '../../../../lib/prisma';
import convertToSubcurrency from '../../../../lib/convertToSubcurrency';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).end('Method Not Allowed');
  }

  try {
    const { reservation_id, order_id, coupon_code = "" } = req.body;

    let amount = 0;
    let metadata: Record<string, any> = { coupon_code };
    let itemName = '';
    let sessionUrlName = '';

    if (reservation_id && typeof reservation_id === 'string') {
      const reservation = await prisma.reservations.findFirst({
        where: {
          id: reservation_id,
          deleted_status: false,
          verified: true,
        },
      });

      if (!reservation) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Reservation not found or not verified.' });
      }

      amount = convertToSubcurrency(reservation.price_total) ?? 0;
      metadata.reservation_id = reservation_id;
      itemName = 'Appointment Payment';
      sessionUrlName = 'payment';

    } else if (order_id && typeof order_id === 'string') {
      const order = await prisma.orders.findFirst({
        where: {
          id: order_id,
          verified: true,
        },
      });

      if (!order) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: 'Order not found or not verified.' });
      }

      amount = convertToSubcurrency(order.total_price) ?? 0;
      metadata.order_id = order_id;
      itemName = 'Order Payment';
      sessionUrlName = 'order';

    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Either `reservation_id` or `order_id` must be provided.',
      });
    }

    if (!amount) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Missing payment amount.',
      });
    }
    if (typeof amount !== 'number') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: `Invalid payment amount. ${amount} is not a number.`,
      });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: itemName,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${sessionUrlName}-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/${sessionUrlName}-cancel`,
      metadata: {
        reservationInfo: JSON.stringify(metadata), 
      },
    });

    const qrCodeDataURL = await QRCode.toDataURL(session.url!);

    res.status(StatusCodes.OK).json({
      checkoutUrl: session.url,
      qrCode: qrCodeDataURL,
    });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
}
