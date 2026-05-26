export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { dbConnect } from '@/lib/mongoose';
import Donation from '@/lib/models/Donation';
import User, { calcBadge } from '@/lib/models/User';
import VillageStats from '@/lib/models/VillageStats';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { villageId, userId } = session.metadata ?? {};

    if (!villageId || !userId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    await dbConnect();

    // 1. Mark donation completed (idempotent via unique stripeSessionId)
    const donation = await Donation.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        status: 'completed',
        stripePaymentIntentId: session.payment_intent as string,
      },
      { new: true }
    );

    if (!donation) {
      // Already processed or unknown session
      return NextResponse.json({ received: true });
    }

    const amount = donation.amount;

    // 2. Update VillageStats — increment raised + supporters
    await VillageStats.findOneAndUpdate(
      { villageId },
      {
        $inc: { raised: amount, supporters: 1 },
        $set: { lastDonationAt: new Date() },
      },
      { upsert: true }
    );

    // 3. Update User — increment totalDonated, recalculate badge
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { totalDonated: amount } },
      { new: true }
    );
    if (updatedUser) {
      const badge = calcBadge(updatedUser.totalDonated);
      await User.findByIdAndUpdate(userId, { ambassadorBadge: badge });
    }

    // 4. Bust map page cache so new raised values show up
    revalidatePath('/');
  }

  if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
    const obj = event.data.object as { id?: string };
    if (obj.id) {
      await dbConnect();
      await Donation.findOneAndUpdate({ stripeSessionId: obj.id }, { status: 'failed' });
    }
  }

  return NextResponse.json({ received: true });
}
