/**
 * POST /api/subscriptions/checkout
 * Creates a Stripe Checkout session and returns the redirect URL.
 */
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServer } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-11-20.acacia",
});

export async function POST(req: Request) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tier } = await req.json(); // 'pro' | 'pro_annual'

  const priceId =
    tier === "pro_annual"
      ? process.env.STRIPE_PRICE_PRO_ANNUAL!
      : process.env.STRIPE_PRICE_PRO_MONTHLY!;

  // Look up or create Stripe customer
  let stripeCustomerId: string | undefined;
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (existing?.stripe_customer_id) {
    stripeCustomerId = existing.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { toneup_user_id: user.id },
    });
    stripeCustomerId = customer.id;
  }

  const origin = req.headers.get("origin") ?? "https://toneup.app";
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 14,
      metadata: { toneup_user_id: user.id },
    },
    success_url: `${origin}/no/me?upgrade=success`,
    cancel_url: `${origin}/no/upgrade`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    locale: "auto",
  });

  return NextResponse.json({ url: session.url });
}
