/**
 * POST /api/onboarding
 * Saves onboarding data to user_profiles.
 */
import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";

export async function POST(req: Request) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { error } = await supabase
    .from("user_profiles")
    .update({
      age_range: body.ageRange,
      gender: body.gender,
      skin_type: body.skinType,
      skin_goals: body.goals ?? [],
      help_with: body.helpWith ?? [],
      preferences: body.preferences ?? {},
      life_phase: body.lifePhase ?? "none",
      locale: body.locale ?? "no",
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
