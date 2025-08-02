import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { StatusCodes } from 'http-status-codes';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(StatusCodes.METHOD_NOT_ALLOWED).end('Method Not Allowed');
  }

  try {
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number') {
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    });

    res.status(StatusCodes.OK).json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
}
