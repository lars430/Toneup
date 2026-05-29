/**
 * POST /api/skin/analyze-internal
 * Tar imot pre-ekstrahert kalibreringsdata fra klienten (paper RGB + skin RGB),
 * kjører gjennom InternalAdapter, lagrer resultat.
 *
 * Ingen bildeopplasting nødvendig — brukerens ansiktsbilde forlater
 * aldri enheten med mindre brukeren eksplisitt velger å dele det.
 */
import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";
import { getAnalysisProvider } from "@/engine";
import type { UserContext } from "@/engine/types";
import { analyzeSkinProfile, type CalibrationInput } from "@/lib/skin-profile";

export async function POST(req: Request) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body?.paperRgb || !body?.skinRgb) {
    return NextResponse.json({ error: "missing_calibration" }, { status: 400 });
  }

  const useOpenAI =
    process.env.SKIN_ANALYSIS_USE_OPENAI !== "false" &&
    !!process.env.OPENAI_API_KEY;

  const skinProfile = await analyzeSkinProfile(body as CalibrationInput, {
    imageBase64: useOpenAI ? body.imageBase64 : undefined,
    openaiApiKey: useOpenAI ? process.env.OPENAI_API_KEY : undefined,
  });
  const calibrationPayload = { ...body, skinProfile };

  // Load profile for context
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("skin_type, skin_goals, preferences, locale")
    .eq("user_id", user.id)
    .single();

  const ctx: UserContext = {
    userId: user.id,
    skinType: profile?.skin_type ?? "unknown",
    skinGoals: profile?.skin_goals ?? [],
    preferences: profile?.preferences ?? {},
    locale: profile?.locale ?? "no",
  };

  // Pass calibration as JSON envelope through the standard interface
  const engine = getAnalysisProvider();
  const result = await engine.analyzeSkin(
    { source: JSON.stringify(calibrationPayload), mimeType: "application/json" },
    ctx
  );

  // Persist
  const { data: analysis, error } = await supabase
    .from("skin_analyses")
    .insert({
      user_id: user.id,
      image_path: null,            // no image uploaded — privacy by design
      engine: result.engine,
      engine_version: result.engineVersion,
      raw_result: result,
      summary: result.metrics,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    analysisId: analysis.id,
    ...(process.env.NODE_ENV === "development" && skinProfile.debug
      ? { debug: skinProfile.debug }
      : {}),
  });
}
