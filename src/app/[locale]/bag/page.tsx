import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import { buildSignal, scoreBagItem, type FitResult } from "@/lib/fit-now";
import RemoveBagItem from "./_components/RemoveBagItem";

type Tab = "all" | "foundation" | "loved" | "wishlist";

export default async function BagPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { tab?: string };
}) {
  const supabase = createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const activeTab: Tab =
    (["all", "foundation", "loved", "wishlist"] as Tab[]).includes(
      searchParams.tab as Tab
    )
      ? (searchParams.tab as Tab)
      : "all";

  // Build today's signal
  const [{ data: profile }, { data: lastAnalysis }, { data: recentLogs }, { data: allItems }] =
    await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", user.id).single(),
      supabase
        .from("skin_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("taken_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("skin_logs")
        .select("dryness, redness, glow, sensitivity, logged_at")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(7),
      supabase
        .from("makeup_bag_items")
        .select("*, products(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  const season = computeSeason();
  const sig = buildSignal(lastAnalysis, recentLogs ?? [], profile, season);

  const items = allItems ?? [];

  // Score every item once
  const scored = new Map<string, FitResult>();
  for (const item of items) {
    scored.set(item.id, scoreBagItem(item as any, sig));
  }

  const lovedCount = items.filter((i: any) => i.loved).length;
  const foundationCount = items.filter(
    (i: any) => i.products?.category === "foundation"
  ).length;
  const wishlistCount = items.filter(
    (i: any) => i.status === "wishlist"
  ).length;

  const visible = (() => {
    if (activeTab === "foundation")
      return items.filter((i: any) => i.products?.category === "foundation");
    if (activeTab === "loved") return items.filter((i: any) => i.loved);
    if (activeTab === "wishlist")
      return items.filter((i: any) => i.status === "wishlist");
    return items.filter((i: any) => i.status !== "wishlist");
  })();

  // Today's hits across all categories
  const greatToday = items
    .filter((i: any) => i.status !== "wishlist")
    .filter((i: any) => {
      const f = scored.get(i.id);
      return f?.verdict === "great" || f?.verdict === "good";
    });

  const watchToday = items
    .filter((i: any) => i.status !== "wishlist")
    .filter((i: any) => scored.get(i.id)?.verdict === "watch");

  const byCategory: Record<string, any[]> = {};
  if (activeTab === "all") {
    visible.forEach((item: any) => {
      const cat = item.products?.category || "other";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(item);
    });
  }

  const tabs: Array<{ key: Tab; label: string; count?: number }> = [
    { key: "all",        label: "Alt",         count: items.filter((i: any) => i.status !== "wishlist").length },
    { key: "foundation", label: "Foundation",  count: foundationCount },
    { key: "loved",      label: "Elsket",      count: lovedCount },
    { key: "wishlist",   label: "Ønskeliste",  count: wishlistCount },
  ];

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-6 pt-10">

        {/* Header */}
        <div className="mb-7">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            Min sminkepung
          </div>
          <h1 className="font-display text-4xl tracking-wide2 mb-1">
            {activeTab === "foundation"
              ? "Foundation"
              : activeTab === "loved"
              ? "Dine favoritter"
              : activeTab === "wishlist"
              ? "Ønskelisten"
              : "Dine produkter"}
          </h1>
          <p className="font-display italic text-soft-ink text-sm">
            {activeTab === "all" &&
              `${items.length} produkt${items.length !== 1 ? "er" : ""} · ${lovedCount} elsket`}
            {activeTab === "loved" && "Det du faktisk er fornøyd med"}
            {activeTab === "foundation" && "Fargehistorikk og nyanser"}
            {activeTab === "wishlist" && "Produkter du vil teste"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-7 border-b border-stone/30">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.key === "all" ? `/${locale}/bag` : `/${locale}/bag?tab=${tab.key}`}
              className={`flex items-center gap-1 pb-3 px-1 text-[10px] uppercase tracking-[0.28em] border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-ink text-ink"
                  : "border-transparent text-soft-ink/60 hover:text-soft-ink"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[9px] ${
                    activeTab === tab.key ? "text-ink" : "text-mute"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Foundation tab — Shade Match CTA */}
        {activeTab === "foundation" && (
          <Link
            href={`/${locale}/shade-match`}
            className="block bg-ink text-bone px-5 py-4 mb-6 hover:bg-soft-ink transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-bone/50 mb-1">
                  Shade Match
                </div>
                <div className="font-display text-base">
                  Finn ny shade i andre merker
                </div>
              </div>
              <span className="text-bone/70 text-base">→</span>
            </div>
          </Link>
        )}

        {/* Empty state */}
        {visible.length === 0 && (
          <div className="text-center py-16">
            <div className="divider-line mx-auto mb-7" />
            <p className="font-display italic text-soft-ink text-base mb-7 leading-relaxed">
              {activeTab === "loved"
                ? "Du har ikke merket noen produkter som elsket ennå.\nÅpne et produkt og trykk ♥"
                : activeTab === "foundation"
                ? "Ingen foundation registrert ennå."
                : activeTab === "wishlist"
                ? "Ønskelisten er tom."
                : "Sminkepungen er tom.\nLegg til ditt første produkt."}
            </p>
            {activeTab === "all" && (
              <Link
                href={`/${locale}/bag/add`}
                className="btn-primary inline-block w-auto px-8"
              >
                Legg til produkt
              </Link>
            )}
          </div>
        )}

        {/* "Passer i dag" section — only on "all" tab */}
        {activeTab === "all" && greatToday.length > 0 && (
          <section className="mb-7">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
              Passer huden din i dag
            </div>
            <div className="space-y-2">
              {greatToday.slice(0, 3).map((item: any) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  fit={scored.get(item.id)}
                  showLoved
                />
              ))}
            </div>
          </section>
        )}

        {/* "Pause i dag" — flagged items */}
        {activeTab === "all" && watchToday.length > 0 && (
          <section className="mb-7">
            <div className="text-[10px] uppercase tracking-[0.4em] text-accent mb-3">
              Pause i dag
            </div>
            <div className="space-y-2">
              {watchToday.slice(0, 2).map((item: any) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  fit={scored.get(item.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Foundation tab — swatch row + cards */}
        {activeTab === "foundation" && visible.length > 0 && (
          <div className="mb-8">
            <div className="editorial-eyebrow mb-4">Dine nyanser</div>
            <div className="flex flex-wrap gap-2 mb-7">
              {visible
                .filter((i: any) => i.shade_code || i.products?.attributes?.hex)
                .map((item: any) => (
                  <div key={item.id} className="group relative">
                    <div
                      className="w-12 h-12 rounded-sm border border-stone/30"
                      style={{
                        background:
                          item.shade_code ?? item.products?.attributes?.hex,
                      }}
                      title={item.shade_name ?? ""}
                    />
                    {item.loved && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full" />
                    )}
                  </div>
                ))}
            </div>

            <div className="editorial-eyebrow mb-3">Alle foundation</div>
            <div className="space-y-2">
              {visible.map((item: any) => (
                <FoundationCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  fit={scored.get(item.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Loved tab */}
        {activeTab === "loved" && visible.length > 0 && (
          <div className="space-y-2 mb-8">
            {visible.map((item: any) => (
              <ProductCard
                key={item.id}
                item={item}
                locale={locale}
                fit={scored.get(item.id)}
                showLoved
              />
            ))}
          </div>
        )}

        {/* Wishlist tab */}
        {activeTab === "wishlist" && visible.length > 0 && (
          <div className="space-y-2 mb-8">
            {visible.map((item: any) => (
              <ProductCard
                key={item.id}
                item={item}
                locale={locale}
                fit={scored.get(item.id)}
              />
            ))}
          </div>
        )}

        {/* All tab — grouped by category, excluding already-shown today picks */}
        {activeTab === "all" && visible.length > 0 && (
          <>
            {Object.entries(byCategory).map(([cat, list]) => (
              <section key={cat} className="mb-7">
                <div className="editorial-eyebrow mb-3">
                  {translateCategory(cat)}
                </div>
                <div className="space-y-2">
                  {list.map((item: any) =>
                    cat === "foundation" ? (
                      <FoundationCard
                        key={item.id}
                        item={item}
                        locale={locale}
                        fit={scored.get(item.id)}
                      />
                    ) : (
                      <ProductCard
                        key={item.id}
                        item={item}
                        locale={locale}
                        fit={scored.get(item.id)}
                        showLoved
                      />
                    )
                  )}
                </div>
              </section>
            ))}
          </>
        )}

        {/* Add product CTA */}
        {(activeTab === "all" || activeTab === "foundation") && (
          <Link
            href={`/${locale}/bag/add`}
            className="block text-center py-4 border border-ink text-[11px] uppercase tracking-[0.32em] mt-4 mb-6"
          >
            + Legg til produkt
          </Link>
        )}
      </div>

      <BottomNav locale={locale} />
    </main>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function FitTag({ fit }: { fit?: FitResult }) {
  if (!fit || fit.verdict === "neutral" || !fit.reason) return null;
  const styles: Record<string, string> = {
    great: "text-accent",
    good: "text-accent",
    watch: "text-accent",
    neutral: "text-mute",
  };
  return (
    <div className={`text-[10px] tracking-wider mt-1 ${styles[fit.verdict]}`}>
      {fit.verdict === "watch" ? "Vær oppmerksom: " : ""}
      {fit.reason}
    </div>
  );
}

function ProductCard({
  item,
  locale,
  fit,
  showLoved = false,
}: {
  item: any;
  locale: string;
  fit?: FitResult;
  showLoved?: boolean;
}) {
  const href = item.products?.id
    ? `/${locale}/products/${item.products.id}`
    : `/${locale}/bag`;
  return (
    <div className="bg-cream px-4 py-4 flex items-center gap-4 hover:bg-stone/30 transition-colors">
      <Link href={href} className="flex items-center gap-4 flex-1 min-w-0">
        {item.shade_code || item.products?.attributes?.hex ? (
          <div
            className="w-11 h-11 flex-shrink-0 rounded-sm border border-stone/30"
            style={{
              background: item.shade_code ?? item.products?.attributes?.hex,
            }}
          />
        ) : (
          <div className="w-11 h-11 flex-shrink-0 rounded-sm bg-stone/40" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-display text-base truncate">
            {item.products?.name ?? item.notes ?? "Produkt"}
          </div>
          <div className="font-display italic text-xs text-soft-ink truncate">
            {item.products?.brand}
            {item.shade_name && ` · ${item.shade_name}`}
          </div>
          {item.status === "wishlist" && (
            <div className="text-[9px] uppercase tracking-[0.2em] text-accent mt-1">
              Ønskeliste
            </div>
          )}
          <FitTag fit={fit} />
        </div>
      </Link>
      {showLoved && item.loved && (
        <span className="text-accent text-sm flex-shrink-0">♥</span>
      )}
      <RemoveBagItem itemId={item.id} />
    </div>
  );
}

function FoundationCard({
  item,
  locale,
  fit,
}: {
  item: any;
  locale: string;
  fit?: FitResult;
}) {
  const href = item.products?.id
    ? `/${locale}/products/${item.products.id}`
    : `/${locale}/bag`;
  const bg =
    item.shade_code ?? item.products?.attributes?.hex ?? "#D9CFC1";
  return (
    <div className="bg-cream px-4 py-4 flex items-center gap-4 hover:bg-stone/30 transition-colors">
      <Link href={href} className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className="w-11 h-11 flex-shrink-0 rounded-sm border border-stone/30"
          style={{ background: bg }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-display text-base truncate">
            {item.shade_name ?? item.products?.name ?? "Foundation"}
          </div>
          <div className="font-display italic text-xs text-soft-ink truncate">
            {item.products?.brand}
            {item.shade_code && (
              <span className="ml-2 text-mute">{item.shade_code}</span>
            )}
          </div>
          <FitTag fit={fit} />
        </div>
      </Link>
      {item.loved && (
        <span className="text-accent text-sm flex-shrink-0">♥</span>
      )}
      <RemoveBagItem itemId={item.id} />
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function computeSeason(): "spring" | "summer" | "autumn" | "winter" {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

function translateCategory(cat: string): string {
  const map: Record<string, string> = {
    cleanser: "Rens",
    toner: "Toner",
    serum: "Serum",
    moisturizer: "Fuktighet",
    eye_cream: "Øyekrem",
    sunscreen: "Solbeskyttelse",
    mask: "Maske",
    exfoliant: "Eksfoliering",
    oil: "Olje",
    foundation: "Foundation",
    concealer: "Concealer",
    setting_powder: "Pudder",
    blush: "Rouge",
    highlighter: "Highlighter",
    eyeshadow: "Øyeskygge",
    eyeliner: "Eyeliner",
    mascara: "Maskara",
    lipstick: "Leppestift",
    lip_gloss: "Leppeglans",
    brow: "Bryn",
    other: "Annet",
  };
  return map[cat] ?? cat;
}
