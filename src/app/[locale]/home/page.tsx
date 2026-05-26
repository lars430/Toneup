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

  // Score bag → today's top hits
  const scored = (bagItems ?? [])
    .map((item) => ({ item, fit: scoreBagItem(item, sig) }))
    .filter((s) => s.fit.verdict === "great" || s.fit.verdict === "good")
    .sort((a, b) => b.fit.score - a.fit.score);

  const topPicks = scored.slice(0, 3);

  const hasAnalysis = !!lastAnalysis;
  const productCount = bagItems?.length ?? 0;

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-6 pt-10">

        {/* ── Quiet header ─────────────────────────────────────────── */}
        <header className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            {greeting} · {seasonLabel(season, locale)}
          </div>
          <h1 className="font-display text-4xl leading-tight tracking-wide2">
            {firstName ?? "Velkommen"}
          </h1>
        </header>

        {/* ── Today: status + need ─────────────────────────────────── */}
        <section className="mb-4">
          <div className="bg-ink text-bone px-5 py-5">
            <div className="text-[10px] uppercase tracking-[0.32em] text-bone/50 mb-2">
              I dag
            </div>
            <div className="flex items-baseline justify-between gap-4 mb-1">
              <div className="font-display text-3xl leading-none">
                {loggedToday ? feelLabel(lastLog.feel_label) : "Ikke logget"}
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.28em] text-bone/50 mb-1">
                  Trenger
                </div>
                <div className="font-display italic text-base">{needHeadline}</div>
              </div>
            </div>
            {!loggedToday && (
              <Link
                href={`/${locale}/skin-log`}
                className="inline-block mt-3 text-[10px] uppercase tracking-[0.32em] text-bone/80 underline underline-offset-4"
              >
                Logg huden nå →
              </Link>
            )}
            {loggedToday && lastLog.tags?.length > 0 && (
              <div className="font-display italic text-xs text-bone/60 mt-1">
                {lastLog.tags.slice(0, 3).map(tagLabel).join(" · ")}
              </div>
            )}
          </div>
        </section>

        {/* ── Avoid today ─────────────────────────────────────────── */}
        {avoidList.length > 0 && (
          <section className="mb-4">
            <div className="border border-stone/40 px-5 py-4">
              <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-2">
                Unngå i dag
              </div>
              <div className="font-display text-base leading-snug">
                {avoidList.join(" · ")}
              </div>
            </div>
          </section>
        )}

        {/* ── Passer huden din i dag ──────────────────────────────── */}
        {topPicks.length > 0 && (
          <section className="mb-4">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-[10px] uppercase tracking-[0.4em] text-mute">
                Passer huden din i dag
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
                  className="block bg-cream px-4 py-4 hover:bg-stone/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 flex-shrink-0 rounded-sm border border-stone/30"
                      style={{
                        background:
                          item.shade_code ??
                          item.products?.attributes?.hex ??
                          "#D9CFC1",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-base truncate">
                        {item.products?.name ?? item.notes ?? "Produkt"}
                      </div>
                      <div className="font-display italic text-xs text-soft-ink truncate">
                        {item.products?.brand}
                        {item.shade_name && ` · ${item.shade_name}`}
                      </div>
                      {fit.reason && (
                        <div className="text-[10px] tracking-wider text-accent mt-1">
                          {fit.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Shade Match CTA ────────────────────────────────────── */}
        <section className="mb-4">
          <Link
            href={`/${locale}/shade-match`}
            className="block bg-cream px-5 py-5 hover:bg-stone/30 transition-colors group"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.4em] text-accent mb-2">
                  Shade Match
                </div>
                <div className="font-display text-xl leading-snug mb-1">
                  Finn din foundation-shade
                </div>
                <div className="font-display italic text-xs text-soft-ink">
                  {hasAnalysis
                    ? `Basert på ${undertoneLabel(
                        lastAnalysis.raw_result?.undertone ??
                          lastAnalysis.raw_result?.raw?.undertone
                      ).toLowerCase() || "din palett"}`
                    : "Vi matcher mot 472 nyanser"}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <FoundationSwatches analysis={lastAnalysis} />
                <span className="text-mute group-hover:text-ink transition-colors text-base">
                  →
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* ── Analysis card ─────────────────────────────────────── */}
        {hasAnalysis ? (
          <section className="mb-4">
            <Link
              href={`/${locale}/analyze/result/${lastAnalysis.id}`}
              className="block border border-stone/40 px-5 py-5 hover:border-ink transition-colors"
            >
              <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-2">
                Din palett
              </div>
              <div className="font-display text-xl leading-tight mb-1">
                {lastAnalysis.raw_result?.shadeLabel ??
                  lastAnalysis.summary?.depth ??
                  "Se hudpalett"}
              </div>
              <div className="font-display italic text-xs text-soft-ink">
                {undertoneLabel(
                  lastAnalysis.raw_result?.undertone ??
                    lastAnalysis.raw_result?.raw?.undertone
                )}{" "}
                · {formatRelative(lastAnalysis.taken_at)}
              </div>
            </Link>
          </section>
        ) : (
          <section className="mb-4">
            <Link
              href={`/${locale}/analyze/calibrate`}
              className="block border border-ink px-5 py-5"
            >
              <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-2">
                Ritual N° 01
              </div>
              <div className="font-display text-xl mb-1">
                Start med din palett
              </div>
              <div className="font-display italic text-xs text-soft-ink">
                Nøyaktig fargelesning av huden din
              </div>
            </Link>
          </section>
        )}

        {/* ── Ask advisor CTA ────────────────────────────────────── */}
        <section className="mb-8">
          <Link
            href={`/${locale}/ask`}
            className="flex items-center justify-between border border-stone/40 px-5 py-4 hover:border-ink transition-colors"
          >
            <div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-1">
                {isPro ? "Rådgiveren · Pro" : "Rådgiveren"}
              </div>
              <div className="font-display text-base">
                Spør om hud, sminke eller produkter
              </div>
            </div>
            <span className="text-mute text-base">→</span>
          </Link>
        </section>

        {/* ── Pro upsell ─────────────────────────────────────────── */}
        {!isPro && hasAnalysis && (
          <section className="border border-ink px-6 py-7 text-center mb-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-accent mb-3">
              Toneup Pro
            </div>
            <h3 className="font-display text-2xl mb-3 leading-snug">
              En personlig rådgiver<br />som kjenner deg
            </h3>
            <p className="font-display italic text-sm text-soft-ink mb-6 leading-relaxed">
              Sesongprofil, AI-rådgiver, ubegrensede analyser.
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
          {productCount > 0 && ` · ${productCount} produkt${productCount !== 1 ? "er" : ""} i pungen`}
        </p>
      </div>

      <BottomNav locale={locale} />
    </main>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function FoundationSwatches({ analysis }: { analysis: any }) {
  const raw = analysis?.raw_result?.raw ?? analysis?.raw_result ?? {};
  const rgb = raw.correctedSkinRgb;
  if (rgb && Array.isArray(rgb)) {
    const hex = rgbToHex(rgb);
    return <div className="w-8 h-8 rounded-sm" style={{ background: hex }} />;
  }
  return (
    <div className="flex gap-1">
      <div className="w-4 h-8 bg-[#EBCBA8]" />
      <div className="w-4 h-8 bg-[#DDB791]" />
      <div className="w-4 h-8 bg-[#AB7F4D]" />
    </div>
  );
}

function rgbToHex([r, g, b]: number[]): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

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
    cool: "Kjølig undertone",
    neutral: "Nøytral undertone",
  };
  return key ? (m[key] ?? "") : "";
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
