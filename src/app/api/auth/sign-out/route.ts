import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";

export async function POST(req: Request) {
  const supabase = createServer();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/no", req.url), 303);
}
