import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServer } from "@/lib/supabase";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
    apiVersion: "2026-04-22.dahlia",
  });
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/no/sign-in", req.url));

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!sub?.stripe_customer_id) {
    return NextResponse.redirect(new URL("/no/upgrade", req.url));
  }

  const origin = req.headers.get("origin") ?? "https://toneup.app";
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${origin}/no/me`,
  });

  return NextResponse.redirect(session.url, 303);
}
