/**
 * Toneup Subscription Layer
 *
 * Handles Stripe Customer Portal, subscription state, and feature gating.
 *
 * Pricing (initial proposal — easy to change in Stripe dashboard):
 *   Free:        Onboarding palette, 1 analysis/month, manual logging,
 *                weekly recommendations, 50 product limit in bag.
 *   Pro:         99 NOK / month
 *                Unlimited analyses, AI questions, before/after gallery,
 *                seasonal profile, shareable cards, full product catalog.
 *   Pro Annual:  990 NOK / year (2 months free)
 *
 * Implementation notes:
 *   - Stripe webhook updates `subscriptions` table.
 *   - Feature flags read from `subscriptions` via Supabase RLS.
 *   - All gates check both `tier` and `status` (must be active or trialing).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type Tier = "free" | "pro" | "pro_annual";
export type Status =
  | "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "paused";

export interface UserSubscription {
  tier: Tier;
  status: Status;
  currentPeriodEnd?: Date;
  trialEndsAt?: Date;
}

// ---- Feature definitions ----

export const FEATURES = {
  unlimited_analyses: ["pro", "pro_annual"],
  ai_questions: ["pro", "pro_annual"],
  before_after_gallery: ["pro", "pro_annual"],
  seasonal_profile: ["pro", "pro_annual"],
  shareable_cards: ["pro", "pro_annual"],
  unlimited_bag: ["pro", "pro_annual"],
  community_signals: ["pro", "pro_annual"],
} as const;

export type Feature = keyof typeof FEATURES;

// ---- Free tier limits ----

export const FREE_LIMITS = {
  analyses_per_month: 1,
  bag_items: 50,
  ai_questions_per_month: 0,
  product_log_items: 30,
} as const;

// ---- Public API ----

export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSubscription> {
  const { data } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end, trial_ends_at")
    .eq("user_id", userId)
    .single();

  if (!data) {
    return { tier: "free", status: "active" };
  }

  return {
    tier: data.tier as Tier,
    status: data.status as Status,
    currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : undefined,
    trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : undefined,
  };
}

export function hasFeature(sub: UserSubscription, feature: Feature): boolean {
  if (sub.status !== "active" && sub.status !== "trialing") return false;
  return (FEATURES[feature] as readonly string[]).includes(sub.tier);
}

export function isProTier(sub: UserSubscription): boolean {
  return (
    (sub.tier === "pro" || sub.tier === "pro_annual") &&
    (sub.status === "active" || sub.status === "trialing")
  );
}

/**
 * Check if user has remaining quota for a free-tier-limited action.
 * Returns { allowed, remaining, reason }.
 */
export async function checkQuota(
  supabase: SupabaseClient,
  userId: string,
  action: "analysis" | "ai_question"
): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
  const sub = await getUserSubscription(supabase, userId);
  if (isProTier(sub)) return { allowed: true, remaining: Infinity };

  // Free tier: check monthly counter
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const column = action === "analysis" ? "analyses_count" : "ai_questions_count";
  const { data } = await supabase
    .from("usage_counters")
    .select(column)
    .eq("user_id", userId)
    .gte("day", firstOfMonth.toISOString().slice(0, 10));

  const used = (data ?? []).reduce(
    (sum: number, row: any) => sum + (row[column] ?? 0),
    0
  );

  const limit =
    action === "analysis"
      ? FREE_LIMITS.analyses_per_month
      : FREE_LIMITS.ai_questions_per_month;

  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    reason: used >= limit ? "monthly_limit_reached" : undefined,
  };
}

export async function incrementUsage(
  supabase: SupabaseClient,
  userId: string,
  action: "analysis" | "ai_question"
): Promise<void> {
  const column = action === "analysis" ? "analyses_count" : "ai_questions_count";
  const today = new Date().toISOString().slice(0, 10);

  await supabase.rpc("increment_usage_counter", {
    p_user_id: userId,
    p_day: today,
    p_column: column,
  });
}
