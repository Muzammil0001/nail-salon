import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { StatusCodes } from 'http-status-codes';
import QRCode from 'qrcode';
import { saveReservationToDB } from '../../../../lib/reservationServices';
import { saveOrderToDB } from '../../../../lib/orderServices';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).end('Method Not Allowed');
  }

  try {
    const { amount, reservation, order } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: 'Invalid or missing `amount` in request body.' });
    }

    let metadata: Record<string, string> = {};
    let isAppointment = false;

    if (reservation && typeof reservation === 'object') {
      const result = await saveReservationToDB({ ...reservation });
      if (!result.success || !result.reservation) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Failed to save reservation.' });
      }

      isAppointment = true;
      metadata = {
        type: 'reservation',
        reservation_id: result.reservation.id,
        coupon_code: result.reservation.coupon_code || '',
      };
    } else if (order && typeof order === 'object') {
      const result = await saveOrderToDB({ ...order });

      if (!result.success || !result.order) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: 'Failed to save order.' });
      }

      metadata = {
        type: 'order',
        order_id: result.order.id,
        coupon_code: result.order.coupon_code || '',
      };
    } else {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: 'Either `reservation` or `order` must be provided and be an object.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: isAppointment ? 'Appointment Payment' : 'Order Payment',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-cancel`,
      metadata: {
        reservationInfo: JSON.stringify(metadata), 
      },
    });

    const qrCodeDataURL = await QRCode.toDataURL(session.url!);

    res.status(StatusCodes.OK).json({
      checkoutUrl: session.url,
      qrCode: qrCodeDataURL,
      metadata,
      orderId: metadata.order_id,
      reservationId: metadata.reservation_id,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
}
