import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServer } from "@/lib/supabase";
import {
  getUserSubscription,
  hasFeature,
  checkQuota,
  incrementUsage,
} from "@/lib/subscriptions";

const SYSTEM_PROMPT = `Du er Toneups rådgiver — en stille, kunnskapsrik veileder for hud og sminke.

Tone:
- Lavmælt, fransk-skandinavisk, redaksjonell
- Konkret kunnskap, ikke salgsspråk
- Bruk korte avsnitt
- Aldri rop, aldri push

Du er IKKE lege. Henvis til hudlege ved medisinske tilstander.
Du selger ikke produkter — du forklarer dem.
Bruk norsk (bokmål) som hovedspråk.`;

export async function POST(req: Request) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
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

  // Optionally include the user's profile context (so the answer feels personal)
  let context = "";
  if (includeProfile) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("skin_type, skin_goals, preferences")
      .eq("user_id", user.id)
      .single();
    if (profile) {
      context = `\n\nKontekst om brukeren: hudtype ${profile.skin_type}, mål ${(profile.skin_goals ?? []).join(", ")}.`;
    }
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: question + context },
      ],
    });

    const answer = response.content
      .filter((c) => c.type === "text")
      .map((c) => (c as any).text)
      .join("\n");

    // Log for cost tracking
    const tokensUsed = (response.usage.input_tokens + response.usage.output_tokens);
    const costUsd = (response.usage.input_tokens * 3 + response.usage.output_tokens * 15) / 1_000_000;

    await supabase.from("ai_questions").insert({
      user_id: user.id,
      question,
      answer,
      context_used: { included_profile: includeProfile },
      tokens_used: tokensUsed,
      cost_usd: costUsd,
    });

    await incrementUsage(supabase, user.id, "ai_question");

    return NextResponse.json({ answer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
