/**
 * POST /api/analyze-skin
 *
 * Server-side skin profile analysis (OpenAI Vision when configured).
 * Returns structured JSON only — no product matching.
 *
 * Body: { calibration: CalibrationInput, imageBase64?: string }
 */
import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";
import {
  analyzeSkinProfile,
  type CalibrationInput,
} from "@/lib/skin-profile";

export async function POST(req: Request) {
  const supabase = createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const calibration = body?.calibration ?? body;
  if (!calibration?.paperRgb || !calibration?.skinRgb) {
    return NextResponse.json({ error: "missing_calibration" }, { status: 400 });
  }

  const useOpenAI =
    process.env.SKIN_ANALYSIS_USE_OPENAI !== "false" &&
    !!process.env.OPENAI_API_KEY;

  const profile = await analyzeSkinProfile(calibration as CalibrationInput, {
    imageBase64: useOpenAI ? body?.imageBase64 : undefined,
    openaiApiKey: useOpenAI ? process.env.OPENAI_API_KEY : undefined,
  });

  return NextResponse.json({
    profile,
    ...(process.env.NODE_ENV === "development" && profile.debug
      ? { debug: profile.debug }
      : {}),
  });
}
