import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import { getUserSubscription, isProTier } from "@/lib/subscriptions";
import BottomNav from "@/components/BottomNav";
import {
  buildSignal,
  scoreBagItem,
  todayNeed,
  todayAvoid,
} from "@/lib/fit-now";

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

  const { data: lastAnalysis } = await supabase
    .from("skin_analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("taken_at", { ascending: false })
    .limit(1)
    .single();

  const { data: recentLogs } = await supabase
    .from("skin_logs")
    .select("feel_label, dryness, oiliness, redness, glow, sensitivity, tags, logged_at")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(7);

  const { data: bagItems } = await supabase
    .from("makeup_bag_items")
    .select("*, products(*)")
    .eq("user_id", user.id);

  const greeting = getGreeting();
  const season = computeSeason();
  const firstName = profile.display_name?.split(" ")[0] ?? null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const lastLog = recentLogs?.[0] ?? null;
  const loggedToday =
    lastLog && new Date(lastLog.logged_at).toISOString().slice(0, 10) === todayStr;

  const sig = buildSignal(lastAnalysis, recentLogs ?? [], profile, season);
  const needHeadline = todayNeed(sig);
  const avoidList = todayAvoid(sig);

  const scored = (bagItems ?? [])
    .map((item) => ({ item, fit: scoreBagItem(item, sig) }))
    .filter((s) => s.fit.verdict === "great" || s.fit.verdict === "good")
    .sort((a, b) => b.fit.score - a.fit.score);

  const topPicks = scored.slice(0, 2);
  const hasAnalysis = !!lastAnalysis;
  const productCount = bagItems?.length ?? 0;

  const undertone =
    lastAnalysis?.raw_result?.undertone ??
    lastAnalysis?.raw_result?.raw?.undertone ?? null;

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-6 pt-10">

        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="mb-7">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            {greeting} · {seasonLabel(season, locale)}
          </div>
          <h1 className="font-display text-4xl leading-tight tracking-wide2">
            {firstName ?? "Velkommen"}
          </h1>
        </header>

        {/* ── Intro for nye brukere ────────────────────────────────── */}
        {!hasAnalysis && (
          <p className="font-display italic text-soft-ink text-sm mb-7 leading-relaxed">
            Analyser huden med kamera, finn riktige foundation-shades og bruk produktene dine smartere.
          </p>
        )}

        {/* ── Kompakt status for tilbakevendende brukere ───────────── */}
        {hasAnalysis && (
          <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-stone/25">
            <div>
              <span className="font-display text-base">{needHeadline}</span>
              <span className="font-display italic text-xs text-mute ml-2">i dag</span>
            </div>
            <div className="text-[9px] uppercase tracking-[0.28em] text-mute">
              {loggedToday
                ? feelLabel(lastLog.feel_label)
                : formatRelative(lastAnalysis.taken_at)}
            </div>
          </div>
        )}

        {/* ── 2×2 funksjonsrutenett ────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-3 mb-5">
          <FeatureTile
            number="01"
            label="Analyser"
            title={hasAnalysis ? "Hudanalyse" : "Start her"}
            sub={hasAnalysis ? formatRelative(lastAnalysis.taken_at) : "Tar 2 minutter"}
            href={
              hasAnalysis
                ? `/${locale}/analyze/result/${lastAnalysis.id}`
                : `/${locale}/analyze/calibrate`
            }
            dark={!hasAnalysis}
          />
          <FeatureTile
            number="02"
            label="Shade Match"
            title="Finn din farge"
            sub={
              undertone
                ? undertoneShort(undertone)
                : "472 nyanser"
            }
            href={`/${locale}/shade-match`}
          />
          <FeatureTile
            number="03"
            label="Pungen"
            title="Dine produkter"
            sub={
              topPicks.length > 0
                ? `${topPicks.length} passer nå`
                : productCount > 0
                ? `${productCount} produkt${productCount !== 1 ? "er" : ""}`
                : "Legg til produkter"
            }
            href={`/${locale}/bag`}
          />
          <FeatureTile
            number="04"
            label={isPro ? "Rådgiver · Pro" : "Rådgiver"}
            title="Spør om hud"
            sub={isPro ? "Personlig AI" : "Sminke og rutiner"}
            href={`/${locale}/ask`}
          />
        </section>

        {/* ── Unngå i dag ─────────────────────────────────────────── */}
        {avoidList.length > 0 && (
          <div className="mb-5 text-[10px] leading-relaxed">
            <span className="uppercase tracking-[0.32em] text-mute">Unngå i dag</span>
            <span className="font-display text-ink ml-2">{avoidList.join(" · ")}</span>
          </div>
        )}

        {/* ── Top picks fra pungen ─────────────────────────────────── */}
        {topPicks.length > 0 && (
          <section className="mb-5">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.4em] text-mute">
                Passer nå
              </div>
              <Link
                href={`/${locale}/bag`}
                className="text-[10px] uppercase tracking-[0.28em] text-soft-ink underline underline-offset-4"
              >
                Se alt
              </Link>
            </div>
            <div className="space-y-2">
              {topPicks.map(({ item, fit }) => (
                <Link
                  key={item.id}
                  href={
                    item.products?.id
                      ? `/${locale}/products/${item.products.id}`
                      : `/${locale}/bag`
                  }
                  className="block bg-cream px-4 py-3 hover:bg-stone/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 flex-shrink-0 rounded-sm border border-stone/30"
                      style={{
                        background:
                          item.shade_code ??
                          item.products?.attributes?.hex ??
                          "#D9CFC1",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm truncate">
                        {item.products?.name ?? item.notes ?? "Produkt"}
                      </div>
                      <div className="font-display italic text-xs text-soft-ink truncate">
                        {item.products?.brand}
                        {(item.shade_name ?? item.products?.shade_name) &&
                          ` · ${item.shade_name ?? item.products?.shade_name}`}
                      </div>
                    </div>
                    {fit.reason && (
                      <div className="text-[9px] tracking-wider text-accent flex-shrink-0">
                        {fit.reason}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Pro upsell ───────────────────────────────────────────── */}
        {!isPro && hasAnalysis && (
          <section className="border border-ink px-5 py-5 text-center mb-6">
            <div className="text-[10px] uppercase tracking-[0.4em] text-accent mb-2">
              Toneup Pro
            </div>
            <p className="font-display text-base mb-1 leading-snug">
              AI-rådgiver · Sesongprofil · Ubegrensede analyser
            </p>
            <Link
              href={`/${locale}/upgrade`}
              className="inline-block mt-3 bg-ink text-bone px-6 py-3 text-[11px] uppercase tracking-[0.32em]"
            >
              Se Pro · 14 dagers prøvetid
            </Link>
          </section>
        )}

        <p className="text-[10px] tracking-wider text-mute text-center mt-6 mb-2 leading-relaxed">
          Toneup følger huden din gjennom alle sesonger.
          {productCount > 0 &&
            ` · ${productCount} produkt${productCount !== 1 ? "er" : ""} i pungen`}
        </p>
      </div>

      <BottomNav locale={locale} />
    </main>
  );
}

// ── Tile-komponent ─────────────────────────────────────────────────────────

function FeatureTile({
  number,
  label,
  title,
  sub,
  href,
  dark = false,
}: {
  number: string;
  label: string;
  title: string;
  sub: string;
  href: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col justify-between px-4 py-5 min-h-[116px] transition-colors ${
        dark
          ? "bg-ink hover:bg-soft-ink"
          : "bg-cream hover:bg-stone/30"
      }`}
    >
      <div
        className={`text-[9px] uppercase tracking-[0.32em] ${
          dark ? "text-bone/50" : "text-mute"
        }`}
      >
        {number} · {label}
      </div>
      <div>
        <div
          className={`font-display text-xl leading-tight mb-1 ${
            dark ? "text-bone" : "text-ink"
          }`}
        >
          {title}
        </div>
        <div
          className={`font-display italic text-xs leading-relaxed ${
            dark ? "text-bone/60" : "text-soft-ink"
          }`}
        >
          {sub}
        </div>
      </div>
    </Link>
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

function undertoneShort(key?: string | null): string {
  const m: Record<string, string> = {
    warm: "Varm undertone",
    cool: "Kjølig undertone",
    neutral: "Nøytral undertone",
    olive: "Oliven undertone",
  };
  return key ? (m[key] ?? "Se alle shades") : "Se alle shades";
}

function formatRelative(date: string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "nettopp";
  if (hours < 24) return `for ${hours}t siden`;
  if (days === 1) return "i går";
  if (days < 7) return `for ${days} dager siden`;
  if (days < 30) return `for ${Math.floor(days / 7)} uker siden`;
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
}
