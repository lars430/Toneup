import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";
import { getUserSubscription, isProTier, FREE_LIMITS } from "@/lib/subscriptions";

/**
 * POST /api/ai/actions
 *
 * Executes a list of advisor-proposed actions after user confirmation.
 * Resolves product "label" strings to catalog IDs by normalizing separators
 * (en-dash, em-dash, colon, hyphen) on both sides — same logic as the
 * mention detector in /api/ai/ask.
 *
 * Returns per-action results so the UI can show which ones succeeded.
 */

type Action =
  | { type: "legg_i_pung"; label: string }
  | { type: "flytt_til_onskeliste"; label: string }
  | {
      type: "logg_hud";
      feel?: string;
      metrics?: Record<string, number>;
      tags?: string[];
      freeText?: string;
    };

type ActionResult = { ok: boolean; message: string };

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[–—:\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: Request) {
  const supabase = createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { actions } = (await req.json()) as { actions: Action[] };
  if (!Array.isArray(actions) || actions.length === 0) {
    return NextResponse.json({ error: "no_actions" }, { status: 400 });
  }

  // Fetch catalog once for product label resolution
  const needsCatalog = actions.some(
    (a) => a.type === "legg_i_pung" || a.type === "flytt_til_onskeliste"
  );

  const catalog = needsCatalog
    ? (await supabase
        .from("products")
        .select("id, brand, name, category"))
        .data ?? []
    : [];

  const resolveProduct = (label: string) => {
    const target = normalize(label);
    if (!target) return null;
    for (const p of catalog) {
      const candidate = normalize(`${p.brand} ${p.name}`);
      if (candidate === target || target.includes(candidate)) return p;
    }
    return null;
  };

  // Sub check for bag limits
  const sub = await getUserSubscription(supabase, user.id);
  const pro = isProTier(sub);

  const results: ActionResult[] = [];

  for (const action of actions) {
    if (action.type === "legg_i_pung" || action.type === "flytt_til_onskeliste") {
      const p = resolveProduct(action.label);
      if (!p) {
        results.push({ ok: false, message: `Fant ikke "${action.label}"` });
        continue;
      }

      // Free tier bag-size check (count once per insert; cheap query)
      if (!pro) {
        const { count } = await supabase
          .from("makeup_bag_items")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        if ((count ?? 0) >= FREE_LIMITS.bag_items) {
          results.push({
            ok: false,
            message: `Pungen er full (${FREE_LIMITS.bag_items} på gratisplan)`,
          });
          continue;
        }
      }

      const status =
        action.type === "flytt_til_onskeliste" ? "wishlist" : "using";

      const { error } = await supabase.from("makeup_bag_items").insert({
        user_id: user.id,
        product_id: p.id,
        category: p.category,
        status,
      });

      if (error) {
        if (error.code === "23505") {
          results.push({
            ok: false,
            message: `${p.brand} ${p.name} ligger allerede i pungen`,
          });
        } else {
          results.push({ ok: false, message: error.message });
        }
        continue;
      }

      results.push({
        ok: true,
        message:
          action.type === "flytt_til_onskeliste"
            ? `${p.brand} ${p.name} lagt på ønskelisten`
            : `${p.brand} ${p.name} lagt i pungen`,
      });
      continue;
    }

    if (action.type === "logg_hud") {
      const feel = action.feel ?? "balanced";
      const metrics = action.metrics ?? {};
      const tags = action.tags ?? [];

      const feelDefaults: Record<string, Record<string, number>> = {
        radiant:  { dryness: 4, oiliness: 2, redness: 1, glow: 5, sensitivity: 1, breakouts: 1 },
        balanced: { dryness: 3, oiliness: 3, redness: 2, glow: 3, sensitivity: 2, breakouts: 1 },
        tired:    { dryness: 2, oiliness: 3, redness: 2, glow: 2, sensitivity: 2, breakouts: 2 },
        tight:    { dryness: 1, oiliness: 1, redness: 2, glow: 2, sensitivity: 3, breakouts: 1 },
        reactive: { dryness: 2, oiliness: 3, redness: 5, glow: 2, sensitivity: 5, breakouts: 3 },
        oily:     { dryness: 3, oiliness: 5, redness: 2, glow: 3, sensitivity: 2, breakouts: 3 },
      };
      const defaults = feelDefaults[feel] ?? feelDefaults.balanced;
      const resolved = {
        dryness:     metrics.hydration   ?? defaults.dryness,
        oiliness:    metrics.oiliness    ?? defaults.oiliness,
        redness:     metrics.redness     ?? defaults.redness,
        glow:        metrics.glow        ?? defaults.glow,
        sensitivity: metrics.sensitivity ?? defaults.sensitivity,
        breakouts:   metrics.breakouts   ?? defaults.breakouts,
      };

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
          dryness: resolved.dryness,
          oiliness: resolved.oiliness,
          redness: resolved.redness,
          glow: resolved.glow,
          sensitivity: resolved.sensitivity,
          breakouts: resolved.breakouts,
          tags,
          free_text: action.freeText ?? null,
        },
        { onConflict: "user_id,logged_at" }
      );

      if (error) {
        results.push({ ok: false, message: error.message });
      } else {
        results.push({ ok: true, message: "Hudloggen er oppdatert" });
      }
      continue;
    }

    results.push({ ok: false, message: "Ukjent handling" });
  }

  return NextResponse.json({ results });
}
