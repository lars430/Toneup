import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";

/**
 * POST /api/skin-log
 *
 * Upserts a daily skin log (one row per user per day — unique constraint).
 * Accepts either:
 *  - feel + tags + freeText  (legacy / minimal)
 *  - feel + metrics{} + tags + freeText  (enhanced — explicit 1-5 values)
 *
 * DB column names: dryness (not hydration), free_text (not notes).
 */
export async function POST(req: Request) {
  const supabase = createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { feel, metrics, tags, freeText } = await req.json();

  // Feel → default metric proxies
  const feelDefaults: Record<string, Record<string, number>> = {
    radiant:  { dryness: 4, oiliness: 2, redness: 1, glow: 5, sensitivity: 1, breakouts: 1 },
    balanced: { dryness: 3, oiliness: 3, redness: 2, glow: 3, sensitivity: 2, breakouts: 1 },
    tired:    { dryness: 2, oiliness: 3, redness: 2, glow: 2, sensitivity: 2, breakouts: 2 },
    tight:    { dryness: 1, oiliness: 1, redness: 2, glow: 2, sensitivity: 3, breakouts: 1 },
    reactive: { dryness: 2, oiliness: 3, redness: 5, glow: 2, sensitivity: 5, breakouts: 3 },
    oily:     { dryness: 3, oiliness: 5, redness: 2, glow: 3, sensitivity: 2, breakouts: 3 },
  };
  const defaults = feelDefaults[feel] ?? feelDefaults.balanced;

  // Explicit metrics override feel defaults.
  // The UI sends key "hydration" (fuktighet); DB column is "dryness" — same scale.
  const resolved = {
    dryness:     metrics?.hydration   ?? defaults.dryness,
    oiliness:    metrics?.oiliness    ?? defaults.oiliness,
    redness:     metrics?.redness     ?? defaults.redness,
    glow:        metrics?.glow        ?? defaults.glow,
    sensitivity: metrics?.sensitivity ?? defaults.sensitivity,
    breakouts:   metrics?.breakouts   ?? defaults.breakouts,
  };

  // foundation_sat_well: derive from tags if present
  const foundationGood  = (tags ?? []).includes("good_foundation");
  const foundationBad   = (tags ?? []).includes("bad_foundation");
  const foundationSatWell = foundationGood ? true : foundationBad ? false : null;

  // Use date string (YYYY-MM-DD) matching the DB date column type.
  // Avoids timezone edge cases where toISOString() could return yesterday.
  const today = new Date();
  const loggedAt = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const { error } = await supabase.from("skin_logs").upsert(
    {
      user_id: user.id,
      logged_at: loggedAt,
      feel_label: feel,
      dryness:     resolved.dryness,
      oiliness:    resolved.oiliness,
      redness:     resolved.redness,
      glow:        resolved.glow,
      sensitivity: resolved.sensitivity,
      breakouts:   resolved.breakouts,
      foundation_sat_well: foundationSatWell,
      tags: tags ?? [],
      free_text: freeText ?? null,
    },
    { onConflict: "user_id,logged_at" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
