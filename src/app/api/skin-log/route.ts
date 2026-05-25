import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";

/**
 * POST /api/skin-log
 *
 * Stores a daily skin log entry from the simplified UI.
 * Maps the "feel" choice and tags into the underlying skin_logs table.
 */
export async function POST(req: Request) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { feel, tags, freeText } = await req.json();

  // Map "feel" to underlying numeric proxies (for trend analysis later)
  const feelMap: Record<string, { hydration: number; oiliness: number; redness: number; glow: number }> = {
    radiant:  { hydration: 4, oiliness: 2, redness: 1, glow: 5 },
    balanced: { hydration: 3, oiliness: 3, redness: 2, glow: 3 },
    tired:    { hydration: 2, oiliness: 3, redness: 2, glow: 2 },
    tight:    { hydration: 1, oiliness: 1, redness: 2, glow: 2 },
    reactive: { hydration: 2, oiliness: 3, redness: 5, glow: 2 },
    oily:     { hydration: 3, oiliness: 5, redness: 2, glow: 3 },
  };
  const vals = feelMap[feel] || feelMap.balanced;

  const { error } = await supabase.from("skin_logs").insert({
    user_id: user.id,
    hydration: vals.hydration,
    oiliness: vals.oiliness,
    redness: vals.redness,
    glow: vals.glow,
    feel_label: feel,
    tags: tags || [],
    notes: freeText || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
