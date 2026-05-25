/**
 * POST /api/skin/analyze
 * Tar imot et bilde, kjører gjennom AnalysisProvider (Revieve/Mock),
 * lagrer resultat i skin_analyses, returnerer normalized data.
 */
import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";
import { getAnalysisProvider } from "@/engine";
import type { UserContext } from "@/engine/types";

export async function POST(req: Request) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "missing_image" }, { status: 400 });

  // 1. Upload to Supabase Storage
  const path = `users/${user.id}/skin-analyses/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("skin-images")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // 2. Load user profile for context
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

  // 3. Run through engine (Mock/Revieve — UI doesn't care which)
  const engine = getAnalysisProvider();
  const buf = Buffer.from(await file.arrayBuffer());
  const result = await engine.analyzeSkin(
    { source: buf, mimeType: file.type },
    ctx
  );

  // 4. Persist result
  const { data: analysis, error: insertError } = await supabase
    .from("skin_analyses")
    .insert({
      user_id: user.id,
      image_path: path,
      engine: result.engine,
      engine_version: result.engineVersion,
      raw_result: result,
      summary: result.metrics,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ analysis });
}
