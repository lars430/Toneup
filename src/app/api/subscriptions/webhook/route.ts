/**
 * POST /api/subscriptions/webhook
 *
 * Stripe sends events here when subscription state changes.
 * Use service role to write to subscriptions table.
 */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-11-20.acacia",
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no signature" }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const types = [
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];

  if (!types.includes(event.type)) {
    return NextResponse.json({ received: true });
  }

  const sub = event.data.object as Stripe.Subscription;
  const userId = sub.metadata.toneup_user_id;
  if (!userId) {
    return NextResponse.json({ error: "no user metadata" }, { status: 400 });
  }

  // Map Stripe price to our tier
  const priceId = sub.items.data[0]?.price.id;
  const tier =
    priceId === process.env.STRIPE_PRICE_PRO_ANNUAL
      ? "pro_annual"
      : priceId === process.env.STRIPE_PRICE_PRO_MONTHLY
      ? "pro"
      : "free";

  await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: sub.id,
        tier: event.type === "customer.subscription.deleted" ? "free" : tier,
        status: sub.status,
        trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  return NextResponse.json({ received: true });
}
