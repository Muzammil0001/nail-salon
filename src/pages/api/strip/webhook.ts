import { buffer } from 'micro';
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { StatusCodes } from 'http-status-codes';
import { confirmReservationPayment } from '../../../../lib/reservationServices';
import { confirmOrderPayment } from '../../../../lib/orderServices';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).end('method_not_allowed');
  }

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(StatusCodes.BAD_REQUEST).send('Missing Stripe signature');
    }

    event = stripe.webhooks.constructEvent(buf.toString(), sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(StatusCodes.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
  }

  console.log("====== ~ handler ~ event.type:", event.type)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      const meta = session.metadata?.reservationInfo;

      if (!meta) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Missing metadata" });
      }

      const parsed = JSON.parse(meta);
      const reservationId: string = parsed.reservation_id || "";
      const orderId: string = parsed.order_id || "";
      const couponCode: string = parsed.coupon_code || "";

      if (!reservationId && !orderId) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: "Missing reservation_id or order_id" });
      }

      if (!session.payment_intent) {
        console.warn('No payment_intent found in session');
        return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Missing payment intent' });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string);

      let dbResult;
      if (reservationId) {
        dbResult = await confirmReservationPayment(reservationId, paymentIntent, couponCode);
      } else {
        dbResult = await confirmOrderPayment(orderId, paymentIntent, couponCode);
      }

      if (!dbResult.success) {
        console.error('Failed to process:', dbResult.message);
        return res.status(StatusCodes.BAD_REQUEST).json({ message: dbResult.message });
      }

      console.log('Successfully processed:', dbResult.message);
      return res.status(StatusCodes.OK).json({ message: dbResult.message });

    } catch (err) {
      console.error("Webhook metadata processing failed:", err);
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Invalid metadata" });
    }
  }

  return res.status(StatusCodes.OK).json({ received: true });
}
