import { NextResponse } from "next/server";
import { createServer } from "@/lib/supabase";

/**
 * GET /api/products/search?q=...&category=...
 *
 * Fuzzy search over the product catalog.
 * Used by the "add to bag" page.
 */
export async function GET(req: Request) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category");

  let query = supabase
    .from("products")
    .select("id, brand, name, category, shade_name, shade_code, attributes, price_tier, verified")
    .limit(40);

  if (category) {
    query = query.eq("category", category);
  }
  if (q && q.length >= 2) {
    // Search both brand and name (case-insensitive)
    query = query.or(`brand.ilike.%${q}%,name.ilike.%${q}%`);
  }
  // Prefer verified products
  query = query.order("verified", { ascending: false }).order("brand").order("name");

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ products: data ?? [] });
}
