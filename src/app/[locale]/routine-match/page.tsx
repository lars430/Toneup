import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";
import { buildSignal } from "@/lib/fit-now";
import { scoreSkincare, type SkincareRow } from "./_lib/skincare-score";

const SKINCARE_CATEGORIES: Array<{ key: string; label: string; sub: string }> = [
  { key: "cleanser",   label: "Rens",          sub: "Steg 1 · Morgen og kveld" },
  { key: "toner",      label: "Toner",         sub: "Steg 2 · Forbereder huden" },
  { key: "serum",      label: "Serum",         sub: "Steg 3 · Den aktive jobben" },
  { key: "eye_cream",  label: "Øyekrem",       sub: "Steg 4 · Forsiktig dabbing" },
  { key: "moisturizer",label: "Fuktighet",     sub: "Steg 5 · Låser inn" },
  { key: "spf",        label: "SPF",           sub: "Morgen · Solbeskyttelse" },
  { key: "mask",       label: "Maske",         sub: "1-2 ganger ukentlig" },
  { key: "exfoliant",  label: "Eksfoliering",  sub: "Maks 2-3 ganger per uke" },
];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  SKINCARE_CATEGORIES.map((c) => [c.key, c.label])
);

export default async function RoutineMatchPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { step?: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

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
        .select("dryness, redness, glow, sensitivity, logged_at")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(7),
    ]);

  const season = computeSeason();
  const sig = buildSignal(lastAnalysis, recentLogs ?? [], profile, season);

  const prefs = {
    skinType: profile?.skin_type ?? null,
    lifePhase: profile?.life_phase ?? null,
    budget: profile?.preferences?.budget ?? null,
    fragranceFree: profile?.preferences?.fragrance_free ?? false,
    vegan: profile?.preferences?.vegan ?? false,
  };

  const selectedStep = searchParams.step;

  // Fetch products for the selected category only (saves bytes)
  let products: SkincareRow[] = [];
  if (selectedStep && SKINCARE_CATEGORIES.find((c) => c.key === selectedStep)) {
    const { data } = await supabase
      .from("products")
      .select("id, brand, name, category, price_tier, attributes")
      .eq("category", selectedStep)
      .order("brand")
      .order("name");
    products = (data ?? []) as SkincareRow[];
  }

  // Rank
  const ranked = products
    .map((p) => ({ p, score: scoreSkincare(p, sig, prefs) }))
    .filter((r) => !r.score.excluded)
    .sort((a, b) => b.score.value - a.score.value);

  const top = ranked.slice(0, 12);

  // Summary lines for what we're matching against
  const matchAgainst = buildMatchSummary(prefs, sig);

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-6 pt-10">

        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <Link
            href={selectedStep ? `/${locale}/routine-match` : `/${locale}/home`}
            className="text-[11px] uppercase tracking-[0.24em] text-soft-ink"
          >
            ← {selectedStep ? "Steg" : "Hjem"}
          </Link>
          <span className="text-[10px] uppercase tracking-[0.32em] text-mute">
            Rutine Match
          </span>
          <span className="w-12" />
        </header>

        <div className="mb-10">
          <h1 className="font-display text-4xl leading-tight tracking-wide2 mb-2">
            {selectedStep ? CATEGORY_LABEL[selectedStep] : "Hudpleie tilpasset deg"}
          </h1>
          <p className="font-display italic text-soft-ink text-base">
            {selectedStep
              ? "Rangert mot huden din i dag"
              : "Velg et steg. Vi rangerer produktene mot hudtypen, behovene og loggene dine."}
          </p>
        </div>

        {/* Match summary */}
        {!selectedStep && matchAgainst.length > 0 && (
          <section className="mb-8 border border-stone/40 px-5 py-4">
            <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-2">
              Vi matcher mot
            </div>
            <div className="font-display text-sm leading-snug text-soft-ink">
              {matchAgainst.join(" · ")}
            </div>
          </section>
        )}

        {/* Step picker */}
        {!selectedStep && (
          <section className="mb-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">
              Velg steg
            </div>
            <div className="space-y-2">
              {SKINCARE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.key}
                  href={`/${locale}/routine-match?step=${cat.key}`}
                  className="block bg-cream px-5 py-4 hover:bg-stone/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-display text-lg">{cat.label}</div>
                      <div className="font-display italic text-xs text-soft-ink mt-1">
                        {cat.sub}
                      </div>
                    </div>
                    <span className="text-mute text-base">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ranked products */}
        {selectedStep && top.length > 0 && (
          <section className="space-y-2 mb-8">
            {top.map(({ p, score }, idx) => (
              <Link
                key={p.id}
                href={`/${locale}/products/${p.id}`}
                className={`block px-4 py-4 transition-colors ${
                  idx === 0
                    ? "bg-ink text-bone hover:bg-soft-ink"
                    : "bg-cream hover:bg-stone/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 flex-shrink-0 rounded-sm border ${
                      idx === 0 ? "border-bone/30" : "border-stone/30"
                    }`}
                    style={{
                      background: p.attributes?.hex ?? "#D9CFC1",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base leading-snug">
                      {p.name}
                    </div>
                    <div
                      className={`font-display italic text-xs mt-1 ${
                        idx === 0 ? "text-bone/70" : "text-soft-ink"
                      }`}
                    >
                      {p.brand}
                      {p.price_tier && ` · ${priceLabel(p.price_tier)}`}
                    </div>
                    {score.reason && (
                      <div
                        className={`text-[10px] tracking-wider mt-2 ${
                          idx === 0 ? "text-bone/80" : "text-accent"
                        }`}
                      >
                        {score.reason}
                      </div>
                    )}
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
          </section>
        )}

        {selectedStep && top.length === 0 && (
          <section className="bg-cream px-5 py-6 text-center mb-8">
            <p className="font-display italic text-soft-ink text-sm">
              Ingen produkter passer kriteriene akkurat nå. Prøv et annet steg.
            </p>
          </section>
        )}

        {/* How it works */}
        {!selectedStep && (
          <section className="mb-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">
              Hvordan
            </div>
            <ol className="space-y-3">
              <Step n="01" label="Velg hvilket steg du vil utforske" />
              <Step n="02" label="Vi rangerer mot hudtype, behov, logger og livsfase" />
              <Step n="03" label="Topptreff først — åpne for full info eller legg i pungen" />
            </ol>
          </section>
        )}

        <p className="text-[10px] tracking-wider text-mute text-center mt-10 leading-relaxed">
          Anbefalingene er veiledende. Lytt til huden din.
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
      <span className="font-display text-sm text-soft-ink leading-relaxed">{label}</span>
    </li>
  );
}

function buildMatchSummary(
  prefs: { skinType?: string | null; lifePhase?: string | null; budget?: string | null },
  sig: ReturnType<typeof buildSignal>
): string[] {
  const out: string[] = [];
  if (prefs.skinType && prefs.skinType !== "unknown")
    out.push(skinTypeLabel(prefs.skinType));
  if ((sig.avgRedness ?? 0) >= 3.5) out.push("Forhøyet rødhet");
  if ((sig.avgDryness ?? 5) <= 2) out.push("Tørrhet");
  if ((sig.avgGlow ?? 5) < 3) out.push("Lav glød");
  if ((sig.avgSensitivity ?? 0) >= 3.5) out.push("Sensitivitet");
  if (prefs.lifePhase === "pregnancy") out.push("Graviditetstrygt");
  if (prefs.budget) out.push(budgetLabel(prefs.budget));
  return out;
}

function skinTypeLabel(t: string): string {
  const m: Record<string, string> = {
    dry: "Tørr hud",
    oily: "Fet hud",
    combination: "Kombinert hud",
    normal: "Normal hud",
    sensitive: "Sensitiv hud",
  };
  return m[t] ?? t;
}

function budgetLabel(b: string): string {
  const m: Record<string, string> = {
    budget: "Rimelig budsjett",
    mid: "Mellompris",
    premium: "Premium",
    luxury: "Luksus",
  };
  return m[b] ?? b;
}

function priceLabel(t: string): string {
  const m: Record<string, string> = {
    budget: "Budsjett",
    mid: "Mellomklasse",
    premium: "Premium",
    luxury: "Luksus",
  };
  return m[t] ?? t;
}

function scoreLabel(score: number, idx: number): string {
  if (idx === 0 && score >= 50) return "Topptreff";
  if (score >= 50) return "Meget god";
  if (score >= 20) return "God";
  if (score >= 0) return "Mulig";
  return "Svak";
}

function computeSeason(): "spring" | "summer" | "autumn" | "winter" {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}
