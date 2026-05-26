import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import { buildSignal } from "@/lib/fit-now";
import { scoreShade } from "./_lib/shade-score";

export default async function ShadeMatchPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { brand?: string };
}) {
  const supabase = createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  // User signal
  const [{ data: profile }, { data: lastAnalysis }, { data: recentLogs }] =
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
        .select("dryness, oiliness, redness, glow, sensitivity, logged_at")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(7),
    ]);

  const season = computeSeason();
  const sig = buildSignal(lastAnalysis, recentLogs ?? [], profile, season);

  // All foundations
  const { data: foundations } = await supabase
    .from("products")
    .select("id, brand, name, shade_name, shade_code, price_tier, attributes")
    .eq("category", "foundation")
    .order("brand")
    .order("name");

  // Distinct brands
  const brands = Array.from(
    new Set((foundations ?? []).map((f) => f.brand))
  ).sort();

  // User's loved foundations (reference points)
  const { data: loved } = await supabase
    .from("makeup_bag_items")
    .select("shade_name, shade_code, products(name, brand, attributes)")
    .eq("user_id", user.id)
    .eq("loved", true);

  const lovedFoundations: any[] = (loved ?? []).filter(
    (i: any) => i.products && (i.shade_code || i.products.attributes?.hex)
  );

  const selectedBrand = searchParams.brand;

  // Rank shades for the selected brand
  const ranked = selectedBrand
    ? (foundations ?? [])
        .filter((f) => f.brand === selectedBrand)
        .map((f) => ({ shade: f, score: scoreShade(f, sig, lovedFoundations) }))
        .sort((a, b) => b.score.value - a.score.value)
    : [];

  // Group ranked by product line within brand
  const groupedByProduct: Record<string, typeof ranked> = {};
  for (const r of ranked) {
    const key = r.shade.name;
    if (!groupedByProduct[key]) groupedByProduct[key] = [];
    groupedByProduct[key].push(r);
  }

  const hasSignal = !!sig.undertone || !!sig.depth;

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-6 pt-10">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <Link
            href={selectedBrand ? `/${locale}/shade-match` : `/${locale}/home`}
            className="text-[11px] uppercase tracking-[0.24em] text-soft-ink"
          >
            ← {selectedBrand ? "Merker" : "Hjem"}
          </Link>
          <span className="text-[10px] uppercase tracking-[0.32em] text-mute">
            Shade Match
          </span>
          <span className="w-12" />
        </header>

        <div className="mb-10">
          <h1 className="font-display text-4xl leading-tight tracking-wide2 mb-2">
            {selectedBrand ?? "Finn din foundation"}
          </h1>
          <p className="font-display italic text-soft-ink text-base">
            {selectedBrand
              ? "Rangert for huden din"
              : "Velg et merke. Vi rangerer nyansene mot palett, logger og favoritter."}
          </p>
        </div>

        {/* Signal summary */}
        {!hasSignal && !selectedBrand && (
          <section className="mb-8 bg-cream px-5 py-5">
            <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-2">
              Vi trenger din palett
            </div>
            <p className="font-display italic text-sm text-soft-ink mb-3 leading-relaxed">
              Uten en hudanalyse blir matchingen omtrentlig. Ta Ritual N° 01 først for nøyaktige forslag.
            </p>
            <Link
              href={`/${locale}/analyze/calibrate`}
              className="inline-block text-[10px] uppercase tracking-[0.32em] underline underline-offset-4"
            >
              Start analyse →
            </Link>
          </section>
        )}

        {hasSignal && !selectedBrand && (
          <section className="mb-8 border border-stone/40 px-5 py-4">
            <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-2">
              Vi matcher mot
            </div>
            <div className="font-display text-base leading-snug">
              {undertoneFull(sig.undertone)}
              {sig.depth ? ` · ${depthLabel(sig.depth)}` : ""}
              {lovedFoundations.length > 0 &&
                ` · ${lovedFoundations.length} favoritter`}
            </div>
          </section>
        )}

        {/* Brand picker */}
        {!selectedBrand && (
          <section className="mb-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">
              Velg merke
            </div>
            <div className="grid grid-cols-2 gap-2">
              {brands.map((brand) => (
                <Link
                  key={brand}
                  href={`/${locale}/shade-match?brand=${encodeURIComponent(brand)}`}
                  className="bg-cream px-4 py-4 hover:bg-stone/30 transition-colors"
                >
                  <div className="font-display text-base truncate">{brand}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ranked shades for selected brand */}
        {selectedBrand && ranked.length > 0 && (
          <section className="space-y-7 mb-8">
            {Object.entries(groupedByProduct).map(([productName, list]) => (
              <div key={productName}>
                <div className="font-display text-lg mb-3">{productName}</div>

                {/* Top 3 strip */}
                <div className="space-y-2">
                  {list.slice(0, 6).map(({ shade, score }, idx) => (
                    <Link
                      key={shade.id}
                      href={`/${locale}/products/${shade.id}`}
                      className={`block px-4 py-4 transition-colors ${
                        idx === 0
                          ? "bg-ink text-bone hover:bg-soft-ink"
                          : "bg-cream hover:bg-stone/30"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 flex-shrink-0 rounded-sm border ${
                            idx === 0 ? "border-bone/30" : "border-stone/30"
                          }`}
                          style={{
                            background:
                              shade.attributes?.hex ?? shade.shade_code ?? "#D9CFC1",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-base">
                            {shade.shade_name ?? "Nyanse"}
                            {shade.shade_code && (
                              <span
                                className={`ml-2 text-xs ${
                                  idx === 0 ? "text-bone/60" : "text-mute"
                                }`}
                              >
                                {shade.shade_code}
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[10px] tracking-wider mt-1 ${
                              idx === 0 ? "text-bone/70" : "text-soft-ink"
                            }`}
                          >
                            {score.reason ?? `${shade.attributes?.depth ?? ""} ${shade.attributes?.undertone ?? ""}`.trim()}
                          </div>
                        </div>
                        <div
                          className={`text-[10px] uppercase tracking-[0.24em] ${
                            idx === 0 ? "text-bone/60" : "text-mute"
                          }`}
                        >
                          {scoreLabel(score.value, idx)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {selectedBrand && ranked.length === 0 && (
          <section className="bg-cream px-5 py-6 text-center mb-8">
            <p className="font-display italic text-soft-ink text-sm">
              Vi har ingen registrerte nyanser for {selectedBrand} ennå.
            </p>
          </section>
        )}

        {/* How it works */}
        {!selectedBrand && (
          <section className="mb-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">
              Hvordan
            </div>
            <ol className="space-y-3">
              <Step n="01" label="Velg merket du vil teste" />
              <Step n="02" label="Vi rangerer nyansene mot din palett og dine logger" />
              <Step n="03" label="Topptreff vises først — kjøp eller legg i pungen" />
            </ol>
          </section>
        )}

        <p className="text-[10px] tracking-wider text-mute text-center mt-10 leading-relaxed">
          Test alltid i dagslys før du kjøper.
        </p>
      </div>

      <BottomNav locale={locale} />
    </main>
  );
}

function Step({ n, label }: { n: string; label: string }) {
  return (
    <li className="flex gap-4 items-baseline">
      <span className="text-[10px] uppercase tracking-[0.32em] text-mute">{n}</span>
      <span className="font-display text-sm text-soft-ink leading-relaxed">
        {label}
      </span>
    </li>
  );
}

function computeSeason(): "spring" | "summer" | "autumn" | "winter" {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

function undertoneFull(u?: string | null): string {
  if (!u) return "Nøytral palett";
  const m: Record<string, string> = {
    warm: "Varm undertone",
    cool: "Kjølig undertone",
    neutral: "Nøytral undertone",
  };
  return m[u] ?? u;
}

function depthLabel(d?: string | null): string {
  if (!d) return "";
  const m: Record<string, string> = {
    fair: "Lys dybde",
    light: "Lys-medium dybde",
    medium: "Medium dybde",
    tan: "Tan dybde",
    deep: "Dyp dybde",
  };
  return m[d] ?? d;
}

function scoreLabel(score: number, idx: number): string {
  if (idx === 0 && score >= 60) return "Topptreff";
  if (score >= 60) return "Meget god";
  if (score >= 30) return "God";
  if (score >= 0) return "Mulig";
  return "Svak";
}
