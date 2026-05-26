import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import { getUserSubscription, isProTier } from "@/lib/subscriptions";
import BottomNav from "@/components/BottomNav";

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect(`/${locale}/onboarding`);

  const sub = await getUserSubscription(supabase, user.id);
  const isPro = isProTier(sub);

  // Last analysis
  const { data: lastAnalysis } = await supabase
    .from("skin_analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("taken_at", { ascending: false })
    .limit(1)
    .single();

  // Last 7 skin logs — used for trend analysis
  const { data: recentLogs } = await supabase
    .from("skin_logs")
    .select("feel_label, hydration, oiliness, redness, glow, tags, logged_at")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(7);

  // Top loved bag items
  const { data: lovedItems } = await supabase
    .from("makeup_bag_items")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .eq("loved", true)
    .limit(3);

  // Bag count for the action tile
  const { count: bagCount } = await supabase
    .from("makeup_bag_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const hasSeenPalette = !!profile.first_palette_shown_at;

  const greeting = getGreeting();
  const season = computeSeason();
  const firstName = profile.display_name?.split(" ")[0] ?? null;

  // Derive today-logged status
  const todayStr = new Date().toISOString().slice(0, 10);
  const lastLog = recentLogs?.[0] ?? null;
  const loggedToday =
    lastLog && new Date(lastLog.logged_at).toISOString().slice(0, 10) === todayStr;

  // Derive skin trend from last 5 logs
  const trendInsight = deriveTrendInsight(recentLogs ?? []);

  // Bag product count for display
  const productCount = bagCount ?? 0;

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-6 pt-10 pb-6">

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="mb-9">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            {greeting} · {seasonLabel(season, locale)}
          </div>
          <h1 className="font-display text-4xl leading-tight tracking-wide2">
            {firstName ? `${firstName}` : "Velkommen tilbake"}
          </h1>
          <p className="font-display italic text-soft-ink text-base mt-2 leading-relaxed">
            {seasonEditorialLine(season)}
          </p>
        </header>

        {/* ── Today's skin status ─────────────────────────────────── */}
        <section className="mb-5">
          {loggedToday ? (
            <div className="bg-cream px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-1">
                  Logget i dag
                </div>
                <div className="font-display text-xl">
                  {feelLabel(lastLog.feel_label)}
                </div>
                {lastLog.tags?.length > 0 && (
                  <div className="font-display italic text-xs text-soft-ink mt-1">
                    {lastLog.tags.slice(0, 3).map(tagLabel).join(" · ")}
                  </div>
                )}
              </div>
              <Link
                href={`/${locale}/skin-log`}
                className="text-[10px] uppercase tracking-[0.3em] text-soft-ink underline underline-offset-4"
              >
                Endre
              </Link>
            </div>
          ) : (
            <Link
              href={`/${locale}/skin-log`}
              className="flex items-center justify-between bg-ink text-bone px-5 py-4 group"
            >
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-bone/60 mb-1">
                  Dagens ritual
                </div>
                <div className="font-display text-xl">Logg huden nå</div>
                {lastLog && (
                  <div className="font-display italic text-xs text-bone/50 mt-1">
                    Sist: {formatRelative(lastLog.logged_at)}
                  </div>
                )}
              </div>
              <span className="text-bone/40 group-hover:text-bone transition-colors text-xl">
                →
              </span>
            </Link>
          )}
        </section>

        {/* ── Skin intelligence ──────────────────────────────────── */}
        <section className="mb-5">
          <div className="border border-stone/40 px-5 py-5">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
              Din hud nå
            </div>

            {lastAnalysis ? (
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="font-display text-2xl leading-tight mb-1">
                    {lastAnalysis.raw_result?.shadeLabel ??
                      lastAnalysis.summary?.depth ??
                      "Din palett"}
                  </div>
                  <div className="font-display italic text-sm text-soft-ink">
                    {undertoneLabel(lastAnalysis.raw_result?.undertone)} ·{" "}
                    {formatRelative(lastAnalysis.taken_at)}
                  </div>
                </div>
                <Link
                  href={`/${locale}/analyze/calibrate`}
                  className="text-[10px] uppercase tracking-[0.28em] text-soft-ink underline underline-offset-4 whitespace-nowrap mt-1"
                >
                  Ny analyse
                </Link>
              </div>
            ) : (
              <div className="mb-4">
                <div className="font-display text-xl mb-2">
                  Start med din første analyse
                </div>
                <Link
                  href={`/${locale}/analyze/calibrate`}
                  className="inline-block text-[10px] uppercase tracking-[0.32em] underline underline-offset-4"
                >
                  Start Ritual N° 01
                </Link>
              </div>
            )}

            {trendInsight && (
              <div className="border-t border-stone/30 pt-4">
                <div className="font-display italic text-sm text-soft-ink leading-relaxed">
                  — {trendInsight}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Season strip ───────────────────────────────────────── */}
        <section className="mb-8">
          <Link
            href={`/${locale}/season`}
            className="flex items-center justify-between bg-cream px-5 py-4 group"
          >
            <div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-1">
                Sesongprofil · {seasonLabel(season, locale)}
              </div>
              <div className="font-display text-base leading-snug">
                {seasonShortInsight(season, profile.skin_type)}
              </div>
            </div>
            <span className="text-mute group-hover:text-ink transition-colors">
              →
            </span>
          </Link>
        </section>

        {/* ── Quick actions ──────────────────────────────────────── */}
        <section className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">
            Snarveier
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/${locale}/analyze/calibrate`}
              className="border border-stone/40 px-5 py-5 hover:border-ink transition-colors"
            >
              <div className="text-[10px] uppercase tracking-[0.3em] text-mute mb-2">
                Ritual N° 01
              </div>
              <div className="font-display text-lg">Analyser huden</div>
              <div className="font-display italic text-xs text-soft-ink mt-1">
                Nøyaktig fargelesning
              </div>
            </Link>

            <Link
              href={`/${locale}/ask`}
              className="border border-stone/40 px-5 py-5 hover:border-ink transition-colors"
            >
              <div className="text-[10px] uppercase tracking-[0.3em] text-mute mb-2">
                {isPro ? "Pro" : "Rådgiveren"}
              </div>
              <div className="font-display text-lg">Spør alt</div>
              <div className="font-display italic text-xs text-soft-ink mt-1">
                Kjenner din historikk
              </div>
            </Link>

            <Link
              href={`/${locale}/bag`}
              className="border border-stone/40 px-5 py-5 hover:border-ink transition-colors"
            >
              <div className="text-[10px] uppercase tracking-[0.3em] text-mute mb-2">
                Sminkepung
              </div>
              <div className="font-display text-lg">Mine produkter</div>
              <div className="font-display italic text-xs text-soft-ink mt-1">
                {productCount > 0
                  ? `${productCount} produkt${productCount !== 1 ? "er" : ""}`
                  : "Legg til første produkt"}
              </div>
            </Link>

            <Link
              href={`/${locale}/season`}
              className="border border-stone/40 px-5 py-5 hover:border-ink transition-colors"
            >
              <div className="text-[10px] uppercase tracking-[0.3em] text-mute mb-2">
                Sesong
              </div>
              <div className="font-display text-lg">
                {seasonLabel(season, locale)}
              </div>
              <div className="font-display italic text-xs text-soft-ink mt-1">
                Hudmønstre over tid
              </div>
            </Link>
          </div>
        </section>

        {/* ── Loved products ─────────────────────────────────────── */}
        {lovedItems && lovedItems.length > 0 && (
          <section className="mb-8">
            <div className="flex justify-between items-baseline mb-4">
              <div className="text-[10px] uppercase tracking-[0.4em] text-mute">
                Fungerer best for deg nå
              </div>
              <Link
                href={`/${locale}/bag?tab=loved`}
                className="text-[10px] uppercase tracking-[0.28em] text-soft-ink underline underline-offset-4"
              >
                Se alle
              </Link>
            </div>
            <div className="space-y-2">
              {lovedItems.map((item: any) => (
                <div key={item.id} className="bg-cream px-5 py-4 flex items-center gap-4">
                  {item.shade_code ? (
                    <div
                      className="w-10 h-10 flex-shrink-0 rounded-sm"
                      style={{ background: item.shade_code }}
                    />
                  ) : (
                    <div className="w-10 h-10 flex-shrink-0 rounded-sm bg-stone/40" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base truncate">
                      {item.products?.name ?? item.notes}
                    </div>
                    <div className="font-display italic text-xs text-soft-ink">
                      {item.products?.brand}
                      {item.shade_name && ` · ${item.shade_name}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Pro upsell ─────────────────────────────────────────── */}
        {!isPro && hasSeenPalette && (
          <section className="border border-ink px-6 py-7 text-center mb-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-accent mb-3">
              Toneup Pro
            </div>
            <h3 className="font-display text-2xl mb-3 leading-snug">
              En personlig rådgiver<br />som kjenner deg
            </h3>
            <p className="font-display italic text-sm text-soft-ink mb-6 leading-relaxed">
              Sesongprofil, AI-rådgiver, ubegrensede analyser og mer.
            </p>
            <Link
              href={`/${locale}/upgrade`}
              className="inline-block bg-ink text-bone px-8 py-3 text-[11px] uppercase tracking-[0.32em]"
            >
              Se Pro · 14 dagers prøvetid
            </Link>
          </section>
        )}

        <p className="text-[10px] tracking-wider text-mute text-center mt-10 leading-relaxed">
          Toneup følger huden din gjennom alle sesonger.
        </p>
      </div>

      <BottomNav locale={locale} />
    </main>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return "God morgen";
  if (h < 17) return "God dag";
  if (h < 21) return "God kveld";
  return "God natt";
}

function computeSeason(): "spring" | "summer" | "autumn" | "winter" {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

function seasonLabel(s: string, locale: string): string {
  const labels: Record<string, Record<string, string>> = {
    no: { spring: "Vår", summer: "Sommer", autumn: "Høst", winter: "Vinter" },
    en: { spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter" },
    da: { spring: "Forår", summer: "Sommer", autumn: "Efterår", winter: "Vinter" },
    sv: { spring: "Vår", summer: "Sommar", autumn: "Höst", winter: "Vinter" },
    es: { spring: "Primavera", summer: "Verano", autumn: "Otoño", winter: "Invierno" },
    fr: { spring: "Printemps", summer: "Été", autumn: "Automne", winter: "Hiver" },
  };
  return labels[locale]?.[s] ?? labels.no[s] ?? s;
}

function seasonEditorialLine(season: string): string {
  const lines: Record<string, string> = {
    spring: "Lyset kommer tilbake. Huden ber om lettere lag og mer fukt.",
    summer: "Beskyttelse og letthet. Huden trenger pust og SPF.",
    autumn: "Reparasjonens tid. Barriéren har jobbet hardt i sommer.",
    winter: "Rikhet og varme. Tyngre kremer, langsomme ritualer.",
  };
  return lines[season] ?? "";
}

function seasonShortInsight(season: string, skinType?: string): string {
  if (skinType === "dry") {
    const m: Record<string, string> = {
      spring: "Tørr hud kan stramne i sesongskiftet",
      summer: "Unngå for mye eksfoliering nå",
      autumn: "Bytt til rikere krem nå",
      winter: "Huden din trenger ekstra fukt om vinteren",
    };
    return m[season] ?? "Sesongbaserte anbefalinger";
  }
  const m: Record<string, string> = {
    spring: "Lette baselag og god fukt fungerer best nå",
    summer: "Mattere finish og lett dekning er sesongfavoritter",
    autumn: "Tid for å bygge opp rutinen igjen",
    winter: "Fuktige serumer og rike kremer gir best resultater",
  };
  return m[season] ?? "Se dine sesongmønstre";
}

function deriveTrendInsight(logs: any[]): string | null {
  if (logs.length < 2) return null;
  const recent = logs.slice(0, 5);
  const avg = (key: string) =>
    recent.reduce((s, l) => s + (l[key] ?? 3), 0) / recent.length;

  const avgHydration = avg("hydration");
  const avgRedness = avg("redness");
  const avgGlow = avg("glow");

  if (avgHydration <= 1.5)
    return "Huden virker tørrere enn vanlig den siste uken";
  if (avgRedness >= 4)
    return "Rødhet har vært forhøyet de siste dagene — vurder å pause aktive ingredienser";
  if (avgGlow >= 4.5) return "Huden stråler for øyeblikket";
  if (avgHydration >= 4 && avgRedness <= 1.5)
    return "Huden er i god balanse akkurat nå";
  return null;
}

function feelLabel(key: string): string {
  const m: Record<string, string> = {
    radiant: "Strålende",
    balanced: "Balansert",
    tired: "Trett",
    tight: "Stram",
    reactive: "Reaktiv",
    oily: "Glinsende",
  };
  return m[key] ?? key;
}

function tagLabel(key: string): string {
  const m: Record<string, string> = {
    breakout: "Urenhet",
    dry_patches: "Tørre flekker",
    redness: "Rødhet",
    smooth: "Glatt",
    good_foundation: "Foundation satt godt",
    bad_foundation: "Foundation satt dårlig",
    slept_well: "Sov godt",
    stressed: "Stresset",
  };
  return m[key] ?? key;
}

function undertoneLabel(key?: string): string {
  const m: Record<string, string> = {
    warm: "Varm undertone",
    cool: "Kald undertone",
    neutral: "Nøytral undertone",
  };
  return key ? (m[key] ?? key) : "";
}

function formatRelative(date: string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "nettopp";
  if (hours < 24) return `for ${hours} time${hours !== 1 ? "r" : ""} siden`;
  if (days === 1) return "i går";
  if (days < 7) return `for ${days} dager siden`;
  if (days < 30) return `for ${Math.floor(days / 7)} uker siden`;
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
}
