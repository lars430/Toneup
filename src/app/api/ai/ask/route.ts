import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServer } from "@/lib/supabase";
import {
  getUserSubscription,
  hasFeature,
  checkQuota,
  incrementUsage,
} from "@/lib/subscriptions";
import { brand } from "@/lib/brand";

const BASE_SYSTEM_PROMPT = `Du er ${brand.name}s personlige rådgiver — en stille, kunnskapsrik veileder for hud og sminke.

Tone:
- Lavmælt, skandinavisk-redaksjonell
- Konkret og direkte kunnskap, aldri salgsspråk
- Korte avsnitt, ingen overdreven entusiasme
- Bruk norsk (bokmål) som standard, men svar på brukerens språk

Regler:
- Du er IKKE lege. Henvis til hudlege ved medisinske tilstander.
- Du selger ikke produkter — du forklarer og anbefaler nøytralt.
- Bruk alltid brukerens historikk og kontekst aktivt i svaret.
- Dersom brukeren spør om foundationtone eller nyanser, bruk undertone og dybde fra analysen.
- Dersom brukeren spør om produktalternativer, ta hensyn til budsjett.`;

export async function POST(req: Request) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sub = await getUserSubscription(supabase, user.id);
  if (!hasFeature(sub, "ai_questions")) {
    return NextResponse.json({ error: "upgrade_required" }, { status: 402 });
  }

  const quota = await checkQuota(supabase, user.id, "ai_question");
  if (!quota.allowed) {
    return NextResponse.json({ error: "quota_exceeded" }, { status: 429 });
  }

  const { question, includeProfile } = await req.json();

  // Build rich personal context
  let contextBlock = "";

  if (includeProfile) {
    // Profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("skin_type, skin_goals, preferences, life_phase, gender, display_name")
      .eq("user_id", user.id)
      .single();

    // Last 7 skin logs
    const { data: recentLogs } = await supabase
      .from("skin_logs")
      .select("feel_label, dryness, redness, glow, sensitivity, breakouts, tags, logged_at")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(7);

    // Last analysis
    const { data: lastAnalysis } = await supabase
      .from("skin_analyses")
      .select("raw_result, summary, taken_at")
      .eq("user_id", user.id)
      .order("taken_at", { ascending: false })
      .limit(1)
      .single();

    // Loved products
    const { data: lovedItems } = await supabase
      .from("makeup_bag_items")
      .select("shade_name, shade_code, products(name, brand, category)")
      .eq("user_id", user.id)
      .eq("loved", true)
      .limit(8);

    // Wishlist
    const { data: wishlistItems } = await supabase
      .from("makeup_bag_items")
      .select("products(name, brand, category)")
      .eq("user_id", user.id)
      .eq("status", "wishlist")
      .limit(5);

    const lines: string[] = ["=== BRUKERENS PERSONLIGE KONTEKST ==="];

    if (profile) {
      lines.push(`Hudtype: ${profile.skin_type ?? "ukjent"}`);
      if (profile.skin_goals?.length)
        lines.push(`Hudmål: ${profile.skin_goals.join(", ")}`);
      if (profile.preferences?.budget)
        lines.push(`Budsjett: ${profile.preferences.budget}`);
      if (profile.preferences?.fragrance_free)
        lines.push("Preferanse: parfymefritt");
      if (profile.preferences?.vegan)
        lines.push("Preferanse: vegansk");
      if (profile.life_phase && profile.life_phase !== "none")
        lines.push(`Livsfase: ${profile.life_phase}`);
    }

    if (lastAnalysis?.raw_result) {
      const r = lastAnalysis.raw_result;
      lines.push(
        `Siste hudanalyse: undertone=${r.undertone ?? "?"}, dybde=${r.depth ?? "?"}${r.shadeLabel ? `, nyanselabel=${r.shadeLabel}` : ""}`
      );
      const concerns = lastAnalysis.summary?.concerns;
      if (concerns?.length)
        lines.push(`Bekymringer fra analyse: ${concerns.map((c: any) => c.label).join(", ")}`);
    }

    if (recentLogs?.length) {
      const avg = (key: string) =>
        Math.round(
          recentLogs.reduce((s, l) => s + ((l as any)[key] ?? 3), 0) /
            recentLogs.length
        );
      lines.push(
        `Siste ${recentLogs.length} hudlogger — gjennomsnitt: fuktighet=${avg("dryness")}/5, rødhet=${avg("redness")}/5, glød=${avg("glow")}/5, sensitivitet=${avg("sensitivity")}/5`
      );
      const recentFeels = recentLogs.map((l) => l.feel_label).filter(Boolean);
      if (recentFeels.length)
        lines.push(`Dominerende hudfølelse: ${recentFeels.join(", ")}`);
    }

    if (lovedItems?.length) {
      const loved = lovedItems.map((i: any) => {
        const p = i.products;
        return `${p?.brand} ${p?.name}${i.shade_name ? ` (${i.shade_name}${i.shade_code ? ` / ${i.shade_code}` : ""})` : ""}`;
      });
      lines.push(`Elskede produkter: ${loved.join("; ")}`);
    }

    if (wishlistItems?.length) {
      const wish = wishlistItems.map(
        (i: any) => `${i.products?.brand} ${i.products?.name}`
      );
      lines.push(`Ønskeliste: ${wish.join("; ")}`);
    }

    const currentSeason = (() => {
      const m = new Date().getMonth();
      if (m >= 2 && m <= 4) return "vår";
      if (m >= 5 && m <= 7) return "sommer";
      if (m >= 8 && m <= 10) return "høst";
      return "vinter";
    })();
    lines.push(`Nåværende sesong: ${currentSeason}`);
    lines.push("=== SLUTT KONTEKST ===");

    contextBlock = "\n\n" + lines.join("\n");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system: BASE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: contextBlock
            ? `${contextBlock}\n\nBrukerens spørsmål: ${question}`
            : question,
        },
      ],
    });

    const answer = response.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("\n");

    const tokensUsed =
      response.usage.input_tokens + response.usage.output_tokens;
    const costUsd =
      (response.usage.input_tokens * 3 + response.usage.output_tokens * 15) /
      1_000_000;

    // Best-effort logging — don't fail the response if table doesn't exist
    try {
      await supabase.from("ai_questions").insert({
        user_id: user.id,
        question,
        answer,
        context_used: { included_profile: includeProfile, context_length: contextBlock.length },
        tokens_used: tokensUsed,
        cost_usd: costUsd,
      });
      await incrementUsage(supabase, user.id, "ai_question");
    } catch {
      // non-fatal
    }

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error("[ai/ask] Anthropic error:", err?.message);
    return NextResponse.json(
      { error: err?.message ?? "ai_error" },
      { status: 500 }
    );
  }
}
