import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const locale = searchParams.get("locale") || "no";
  const next = searchParams.get("next") ?? "";

  if (code) {
    const supabase = createServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const destination = next === "onboarding" ? `/${locale}/onboarding` : `/${locale}/home`;
  return NextResponse.redirect(`${origin}${destination}`);
}
