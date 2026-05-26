import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";

export async function PATCH(req: Request) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();

  // Whitelist editable fields
  const allowed = ["skin_type", "skin_goals", "help_with", "life_phase", "gender", "preferences", "display_name"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { error } = await supabase
    .from("user_profiles")
    .update(update)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
