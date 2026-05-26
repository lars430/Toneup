import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";

/**
 * POST /api/skin-log
 *
 * Accepts either:
 *  - feel + tags + freeText  (legacy / minimal)
 *  - feel + metrics{} + tags + freeText  (enhanced — explicit 1-5 values)
 *
 * Explicit metric values always win over feel-derived defaults.
 */
export async function POST(req: Request) {
  const supabase = createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { feel, metrics, tags, freeText } = await req.json();

  // Feel → default metric proxies (used only when no explicit metrics supplied)
  const feelDefaults: Record<string, Record<string, number>> = {
    radiant:  { hydration: 4, oiliness: 2, redness: 1, glow: 5, sensitivity: 1, breakouts: 1 },
    balanced: { hydration: 3, oiliness: 3, redness: 2, glow: 3, sensitivity: 2, breakouts: 1 },
    tired:    { hydration: 2, oiliness: 3, redness: 2, glow: 2, sensitivity: 2, breakouts: 2 },
    tight:    { hydration: 1, oiliness: 1, redness: 2, glow: 2, sensitivity: 3, breakouts: 1 },
    reactive: { hydration: 2, oiliness: 3, redness: 5, glow: 2, sensitivity: 5, breakouts: 3 },
    oily:     { hydration: 3, oiliness: 5, redness: 2, glow: 3, sensitivity: 2, breakouts: 3 },
  };
  const defaults = feelDefaults[feel] ?? feelDefaults.balanced;

  // Merge: explicit metrics override feel defaults
  const resolved = {
    hydration:   metrics?.hydration   ?? defaults.hydration,
    oiliness:    metrics?.oiliness    ?? defaults.oiliness,
    redness:     metrics?.redness     ?? defaults.redness,
    glow:        metrics?.glow        ?? defaults.glow,
    sensitivity: metrics?.sensitivity ?? defaults.sensitivity,
    breakouts:   metrics?.breakouts   ?? defaults.breakouts,
  };

  const { error } = await supabase.from("skin_logs").insert({
    user_id: user.id,
    logged_at: new Date().toISOString(),
    feel_label: feel,
    hydration:   resolved.hydration,
    oiliness:    resolved.oiliness,
    redness:     resolved.redness,
    glow:        resolved.glow,
    sensitivity: resolved.sensitivity,
    breakouts:   resolved.breakouts,
    tags: tags || [],
    notes: freeText || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
