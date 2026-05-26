import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";
import { getUserSubscription, isProTier, FREE_LIMITS } from "@/lib/subscriptions";

export async function POST(req: Request) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json({ error: "missing productId" }, { status: 400 });
  }

  // Fetch category (NOT NULL in makeup_bag_items) and verify product exists
  const { data: product } = await supabase
    .from("products")
    .select("category")
    .eq("id", productId)
    .single();

  if (!product) {
    return NextResponse.json({ error: "product_not_found" }, { status: 404 });
  }

  // Check free tier bag limit
  const sub = await getUserSubscription(supabase, user.id);
  if (!isProTier(sub)) {
    const { count } = await supabase
      .from("makeup_bag_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) >= FREE_LIMITS.bag_items) {
      return NextResponse.json(
        { error: "bag_limit_reached", limit: FREE_LIMITS.bag_items },
        { status: 402 }
      );
    }
  }

  const { error } = await supabase.from("makeup_bag_items").insert({
    user_id: user.id,
    product_id: productId,
    category: product.category,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "already_in_bag" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: "missing itemId" }, { status: 400 });

  const { error } = await supabase
    .from("makeup_bag_items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
