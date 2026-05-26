import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

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

  // Fetch all bag items with product details
  const { data: allItems } = await supabase
    .from("makeup_bag_items")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = allItems ?? [];

  // Tab counts
  const lovedCount = items.filter((i: any) => i.loved).length;
  const foundationCount = items.filter(
    (i: any) => i.products?.category === "foundation"
  ).length;
  const wishlistCount = items.filter(
    (i: any) => i.status === "wishlist"
  ).length;

  // Filter for active tab
  const visible = (() => {
    if (activeTab === "foundation")
      return items.filter((i: any) => i.products?.category === "foundation");
    if (activeTab === "loved") return items.filter((i: any) => i.loved);
    if (activeTab === "wishlist")
      return items.filter((i: any) => i.status === "wishlist");
    return items.filter((i: any) => i.status !== "wishlist");
  })();

  // For "all" tab: group by category
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
        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            Min sminkepung
          </div>
          <h1 className="font-display text-4xl tracking-wide2 mb-2">
            {activeTab === "foundation"
              ? "Foundation & nyanser"
              : activeTab === "loved"
              ? "Dine favoritter"
              : activeTab === "wishlist"
              ? "Ønskelisten"
              : "Dine produkter"}
          </h1>
          {activeTab === "all" && (
            <p className="font-display italic text-soft-ink text-sm mt-2">
              {lovedCount > 0
                ? `${lovedCount} elsket${lovedCount !== 1 ? "e" : ""} · ${items.length} totalt`
                : `${items.length} produkt${items.length !== 1 ? "er" : ""}`}
            </p>
          )}
          {activeTab === "loved" && (
            <p className="font-display italic text-soft-ink text-sm mt-2">
              Produktene du faktisk er fornøyd med
            </p>
          )}
          {activeTab === "foundation" && (
            <p className="font-display italic text-soft-ink text-sm mt-2">
              Din fargehistorikk og nyanser som passer deg
            </p>
          )}
          {activeTab === "wishlist" && (
            <p className="font-display italic text-soft-ink text-sm mt-2">
              Produkter du vil teste
            </p>
          )}
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-8 border-b border-stone/30">
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

        {/* Empty state */}
        {visible.length === 0 && (
          <div className="text-center py-16">
            <div className="divider-line mx-auto mb-7" />
            <p className="font-display italic text-soft-ink text-base mb-7 leading-relaxed">
              {activeTab === "loved"
                ? "Du har ikke merket noen produkter som elsket ennå.\nÅpne et produkt og trykk ❤"
                : activeTab === "foundation"
                ? "Ingen foundation registrert ennå."
                : activeTab === "wishlist"
                ? "Ønskelisten er tom."
                : "Sminkepungen er ennå tom.\nLegg til ditt første produkt."}
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

        {/* Foundation tab — shade swatch grid */}
        {activeTab === "foundation" && visible.length > 0 && (
          <div className="mb-8">
            {/* Shade swatch row */}
            <div className="editorial-eyebrow mb-4">Dine nyanser</div>
            <div className="flex flex-wrap gap-2 mb-7">
              {visible
                .filter((i: any) => i.shade_code)
                .map((item: any) => (
                  <div key={item.id} className="group relative">
                    <div
                      className="w-12 h-12 rounded-sm"
                      style={{ background: item.shade_code }}
                      title={item.shade_name ?? ""}
                    />
                    {item.loved && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full" />
                    )}
                  </div>
                ))}
            </div>

            {/* Foundation cards */}
            <div className="editorial-eyebrow mb-3">Alle foundation</div>
            <div className="space-y-2">
              {visible.map((item: any) => (
                <FoundationCard key={item.id} item={item} locale={locale} />
              ))}
            </div>
          </div>
        )}

        {/* Loved tab */}
        {activeTab === "loved" && visible.length > 0 && (
          <div className="space-y-2 mb-8">
            {visible.map((item: any) => (
              <ProductCard key={item.id} item={item} locale={locale} showLoved />
            ))}
          </div>
        )}

        {/* Wishlist tab */}
        {activeTab === "wishlist" && visible.length > 0 && (
          <div className="space-y-2 mb-8">
            {visible.map((item: any) => (
              <ProductCard key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}

        {/* All tab — grouped by category */}
        {activeTab === "all" && visible.length > 0 && (
          <>
            {/* Loved products highlighted at top */}
            {lovedCount > 0 && (
              <section className="mb-8">
                <div className="flex justify-between items-baseline mb-3">
                  <div className="editorial-eyebrow">Dine favoritter</div>
                  <Link
                    href={`/${locale}/bag?tab=loved`}
                    className="text-[10px] uppercase tracking-[0.28em] text-soft-ink underline underline-offset-4"
                  >
                    Se alle {lovedCount}
                  </Link>
                </div>
                <div className="space-y-2">
                  {items
                    .filter((i: any) => i.loved)
                    .slice(0, 3)
                    .map((item: any) => (
                      <ProductCard key={item.id} item={item} locale={locale} showLoved />
                    ))}
                </div>
              </section>
            )}

            {/* By category */}
            {Object.entries(byCategory).map(([cat, list]) => (
              <section key={cat} className="mb-8">
                <div className="editorial-eyebrow mb-3">
                  {translateCategory(cat)}
                </div>
                <div className="space-y-2">
                  {list.map((item: any) =>
                    cat === "foundation" ? (
                      <FoundationCard key={item.id} item={item} locale={locale} />
                    ) : (
                      <ProductCard key={item.id} item={item} locale={locale} showLoved />
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

function ProductCard({
  item,
  locale,
  showLoved = false,
}: {
  item: any;
  locale: string;
  showLoved?: boolean;
}) {
  const href = item.products?.id
    ? `/${locale}/products/${item.products.id}`
    : `/${locale}/bag`;
  return (
    <Link
      href={href}
      className="block bg-cream px-4 py-4 hover:bg-stone/20 transition-colors"
    >
      <div className="flex items-center gap-4">
        {item.shade_code ? (
          <div
            className="w-11 h-11 flex-shrink-0 rounded-sm"
            style={{ background: item.shade_code }}
          />
        ) : (
          <div className="w-11 h-11 flex-shrink-0 rounded-sm bg-stone/40" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-display text-base truncate">
            {item.products?.name ?? item.notes ?? "Produkt"}
          </div>
          <div className="font-display italic text-xs text-soft-ink">
            {item.products?.brand}
            {item.shade_name && ` · ${item.shade_name}`}
          </div>
          {item.status === "wishlist" && (
            <div className="text-[9px] uppercase tracking-[0.2em] text-accent mt-1">
              Ønskeliste
            </div>
          )}
        </div>
        {showLoved && item.loved && (
          <span className="text-accent text-sm flex-shrink-0">♥</span>
        )}
      </div>
    </Link>
  );
}

function FoundationCard({ item, locale }: { item: any; locale: string }) {
  const href = item.products?.id
    ? `/${locale}/products/${item.products.id}`
    : `/${locale}/bag`;
  return (
    <Link
      href={href}
      className="block bg-cream px-4 py-4 hover:bg-stone/20 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 flex-shrink-0 rounded-sm border border-stone/30"
          style={{ background: item.shade_code ?? "#D9CFC1" }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-display text-base truncate">
            {item.shade_name ?? item.products?.name ?? "Foundation"}
          </div>
          <div className="font-display italic text-xs text-soft-ink">
            {item.products?.brand}
            {item.shade_code && (
              <span className="ml-2 text-mute">{item.shade_code}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {item.loved && <span className="text-accent text-sm">♥</span>}
          {item.rating && (
            <span className="text-[10px] text-mute">{item.rating}/5</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

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
