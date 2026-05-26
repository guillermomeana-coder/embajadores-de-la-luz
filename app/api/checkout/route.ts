export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe';
import { dbConnect } from '@/lib/mongoose';
import Donation from '@/lib/models/Donation';
import { VILLAGES } from '@/lib/villages';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { villageId, amount } = await req.json();

  const village = VILLAGES.find((v) => v.id === villageId);
  if (!village) return NextResponse.json({ error: 'Aldea no encontrada' }, { status: 400 });
  if (!amount || amount < 50) return NextResponse.json({ error: 'Monto mínimo $50 MXN' }, { status: 400 });

  await dbConnect();

  // Create Stripe checkout session first to get the ID
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    currency: 'mxn',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'mxn',
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: `Luz para ${village.name}`,
            description: village.location,
            images: [],
          },
        },
      },
    ],
    metadata: {
      villageId,
      userId: session.user.id,
    },
    customer_email: session.user.email ?? undefined,
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=1`,
    cancel_url: `${process.env.NEXTAUTH_URL}/`,
  });

  // Save pending donation with Stripe session ID
  await Donation.create({
    userId: session.user.id,
    villageId,
    amount,
    stripeSessionId: checkoutSession.id,
    status: 'pending',
  });

  return NextResponse.json({ url: checkoutSession.url });
}
