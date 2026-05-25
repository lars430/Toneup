import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import { getUserSubscription, isProTier } from "@/lib/subscriptions";

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  // Get profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect(`/${locale}/onboarding`);

  const sub = await getUserSubscription(supabase, user.id);
  const isPro = isProTier(sub);

  // Get most recent skin analysis (if any)
  const { data: lastAnalysis } = await supabase
    .from("skin_analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("taken_at", { ascending: false })
    .limit(1)
    .single();

  // Get most recent skin log
  const { data: lastLog } = await supabase
    .from("skin_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(1)
    .single();

  // Get active recommendations
  const { data: recs } = await supabase
    .from("recommendations")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .eq("active", true)
    .limit(3);

  // Has the user seen their first palette?
  const hasSeenPalette = !!profile.first_palette_shown_at;

  // Today's reading line
  const greeting = getGreeting();
  const season = computeSeason();

  return (
    <main className="min-h-screen bg-bone pb-24">
      <div className="max-w-md mx-auto px-7 py-10">

        {/* Header */}
        <header className="mb-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            {greeting} · {seasonLabel(season)}
          </div>
          <h1 className="font-display text-4xl leading-tight tracking-wide2">
            {profile.display_name ? `Velkommen, ${profile.display_name}` : "Velkommen tilbake"}
          </h1>
          <p className="font-display italic text-soft-ink text-base mt-3">
            {dailyEditorialLine(season)}
          </p>
        </header>

        {/* Status card */}
        <section className="mb-10">
          <div className="bg-cream p-6 mb-3">
            <div className="editorial-eyebrow mb-3">Hudens tilstand</div>
            {lastAnalysis ? (
              <>
                <div className="font-display text-2xl mb-2">
                  {lastAnalysis.raw_result?.shadeLabel || "Din palett"}
                </div>
                <div className="font-display italic text-sm text-soft-ink">
                  Sist analysert {formatRelative(lastAnalysis.taken_at, locale)}
                </div>
              </>
            ) : (
              <>
                <div className="font-display text-xl mb-3">Klar for første analyse</div>
                <Link href={`/${locale}/analyze/calibrate`}
                  className="text-[11px] uppercase tracking-[0.32em] underline">
                  Start ritual N° 01
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Quick actions grid */}
        <section className="grid grid-cols-2 gap-3 mb-10">
          <Link href={`/${locale}/skin-log`}
            className="border border-stone/40 p-5 hover:border-ink transition-colors">
            <div className="editorial-eyebrow mb-2">I dag</div>
            <div className="font-display text-lg">Logg huden</div>
            {lastLog && (
              <div className="font-display italic text-xs text-mute mt-2">
                Sist: {formatRelative(lastLog.logged_at, locale)}
              </div>
            )}
          </Link>

          <Link href={`/${locale}/analyze/calibrate`}
            className="border border-stone/40 p-5 hover:border-ink transition-colors">
            <div className="editorial-eyebrow mb-2">Ritual N° 01</div>
            <div className="font-display text-lg">Analyser</div>
          </Link>

          <Link href={`/${locale}/bag`}
            className="border border-stone/40 p-5 hover:border-ink transition-colors">
            <div className="editorial-eyebrow mb-2">Sminkepung</div>
            <div className="font-display text-lg">Mine produkter</div>
          </Link>

          <Link href={`/${locale}/ask`}
            className="border border-stone/40 p-5 hover:border-ink transition-colors">
            <div className="editorial-eyebrow mb-2">{isPro ? "Pro" : "Spør"}</div>
            <div className="font-display text-lg">Rådgiveren</div>
          </Link>
        </section>

        {/* Recommendations */}
        {recs && recs.length > 0 && (
          <section className="mb-10">
            <div className="flex justify-between items-baseline mb-5">
              <h2 className="font-display text-2xl tracking-wide2">Anbefalt for deg</h2>
              <Link href={`/${locale}/recommendations`}
                className="text-[10px] uppercase tracking-[0.32em] text-soft-ink">
                Se alle
              </Link>
            </div>
            <div className="space-y-3">
              {recs.map((r: any) => (
                <Link key={r.id} href={`/${locale}/product/${r.products.id}`}
                  className="block bg-cream p-5 hover:bg-stone/30 transition-colors">
                  <div className="editorial-eyebrow mb-1">{r.products.category}</div>
                  <div className="font-display text-lg mb-1">{r.products.name}</div>
                  <div className="font-display italic text-sm text-soft-ink">
                    {r.products.brand}
                  </div>
                  {r.rationale && (
                    <div className="text-xs text-soft-ink mt-3 pt-3 border-t border-stone/30 leading-relaxed">
                      — {r.rationale}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Pro upsell — only if not Pro and has used the app a bit */}
        {!isPro && hasSeenPalette && (
          <section className="border border-ink p-6 text-center mb-10">
            <div className="text-[10px] uppercase tracking-[0.4em] text-accent mb-3">
              Toneup Pro
            </div>
            <h3 className="font-display text-2xl mb-3">
              En personlig rådgiver, alltid
            </h3>
            <p className="font-display italic text-sm text-soft-ink mb-5">
              Ubegrensede analyser, AI-rådgiver, før/etter-galleri og mer.
            </p>
            <Link href={`/${locale}/upgrade`}
              className="inline-block bg-ink text-bone px-8 py-3 text-[11px] uppercase tracking-[0.32em]">
              Se Pro · 14 dagers prøvetid
            </Link>
          </section>
        )}

        <p className="text-[10px] tracking-wider text-mute text-center mt-12 leading-relaxed">
          Toneup handler om følge, ikke om perfeksjon.
        </p>
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bone border-t border-stone/30">
        <div className="max-w-md mx-auto flex">
          {[
            { href: `/${locale}/home`, label: "Hjem" },
            { href: `/${locale}/skin-log`, label: "Logg" },
            { href: `/${locale}/bag`, label: "Pung" },
            { href: `/${locale}/me`, label: "Meg" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex-1 py-5 text-center text-[10px] uppercase tracking-[0.32em] text-soft-ink">
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
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

function seasonLabel(s: string): string {
  return { spring: "Vår", summer: "Sommer", autumn: "Høst", winter: "Vinter" }[s] || s;
}

function dailyEditorialLine(season: string): string {
  const lines = {
    spring: "Lyset kommer tilbake. Huden ber om mindre lag, mer fukt.",
    summer: "SPF er ikke valgfritt. Sommeren krever beskyttelse.",
    autumn: "Reparasjonens sesong. Barriéren har jobbet hardt.",
    winter: "Rikheten kalles. Tyngre kremer, varmere ritualer.",
  };
  return lines[season as keyof typeof lines] ?? "";
}

function formatRelative(date: string, locale: string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "i dag";
  if (days === 1) return "i går";
  if (days < 7) return `for ${days} dager siden`;
  if (days < 30) return `for ${Math.floor(days / 7)} uker siden`;
  return d.toLocaleDateString(locale === "no" ? "nb-NO" : locale, {
    day: "numeric", month: "short",
  });
}
