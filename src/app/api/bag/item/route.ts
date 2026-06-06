import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";

/** PATCH /api/bag/item — update shade_name and/or shade_code on a bag item */
export async function PATCH(req: Request) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { itemId, shade_name, shade_code } = await req.json();
  if (!itemId) return NextResponse.json({ error: "missing itemId" }, { status: 400 });

  const update: Record<string, string | null> = {};
  if (shade_name !== undefined) update.shade_name = shade_name || null;
  if (shade_code !== undefined) update.shade_code = shade_code || null;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("makeup_bag_items")
    .update(update)
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
