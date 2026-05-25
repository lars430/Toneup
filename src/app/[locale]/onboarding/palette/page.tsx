import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createServer } from "@/lib/supabase";
import { generateFirstPaletteReport } from "@/lib/first-palette";

export default async function FirstPalettePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createServer();
  const t = await getTranslations();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}`);

  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profileRow) redirect(`/${locale}/onboarding`);

  // Pull a small catalog sample — server side, just enough to pick from.
  const { data: catalog } = await supabase
    .from("products")
    .select("id, brand, name, category, price_tier, attributes, verified")
    .in("category", ["cleanser", "moisturizer", "serum", "spf"])
    .limit(500);

  const profile = {
    userId: profileRow.user_id,
    displayName: profileRow.display_name,
    skinType: profileRow.skin_type ?? "unknown",
    skinGoals: profileRow.skin_goals ?? [],
    helpWith: profileRow.help_with ?? [],
    preferences: profileRow.preferences ?? {},
    gender: profileRow.gender,
    lifePhase: profileRow.life_phase ?? "none",
    locale: profileRow.locale ?? "no",
  };

  const currentSeason = computeSeason();
  const report = generateFirstPaletteReport({
    profile: profile as any,
    currentSeason,
    catalog: catalog ?? [],
  });

  // Mark that we've shown the palette (once)
  await supabase
    .from("user_profiles")
    .update({ first_palette_shown_at: new Date().toISOString() })
    .eq("user_id", user.id);

  return (
    <main className="min-h-screen bg-bone">
      <div className="max-w-md mx-auto px-7 py-10">

        {/* Eyebrow */}
        <div className="text-center mb-8">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            Din palett · {report.paletteNumber}
          </div>
          <h1 className="font-display text-5xl leading-tight tracking-wide2 mb-2">
            {report.paletteName}
          </h1>
          <p className="font-display italic text-soft-ink text-lg mt-3">
            {report.paletteIntroLine}
          </p>
        </div>

        {/* Palette swatches */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {report.paletteColors.map((c, i) => (
            <div key={i} className="text-center">
              <div className="w-full aspect-square rounded-full mb-3"
                style={{ background: c.hex, boxShadow: "inset 0 -4px 12px rgba(0,0,0,0.08)" }} />
              <div className="text-[9px] uppercase tracking-[0.32em] text-mute mb-1">{c.role}</div>
              <div className="font-display text-base">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="divider-line mx-auto mb-10" />

        {/* Character traits */}
        <div className="mb-12">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-6 text-center">
            Din toneup
          </div>
          {report.characterTraits.map((tr, i) => (
            <div key={i} className="mb-7">
              <div className="text-[9px] uppercase tracking-[0.32em] text-accent mb-2">
                {tr.eyebrow}
              </div>
              <h3 className="font-display text-2xl leading-tight mb-3">{tr.title}</h3>
              <p className="text-[14px] text-soft-ink leading-relaxed">{tr.body}</p>
            </div>
          ))}
        </div>

        <div className="divider-line mx-auto mb-10" />

        {/* Starting picks */}
        {report.startingPicks.length > 0 && (
          <div className="mb-12">
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-6 text-center">
              Vi foreslår å starte her
            </div>
            {report.startingPicks.map((p, i) => (
              <div key={i} className="bg-cream p-5 mb-3">
                <div className="text-[9px] uppercase tracking-[0.32em] text-mute mb-2">
                  {p.category}
                </div>
                <div className="font-display text-lg mb-1">{p.name}</div>
                <div className="font-display italic text-sm text-soft-ink mb-3">{p.brand}</div>
                <div className="text-xs text-soft-ink leading-relaxed border-t border-line pt-3 mt-3">
                  — {p.reason}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Today's ritual */}
        <div className="mb-12">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3 text-center">
            Dagens ritual
          </div>
          <h3 className="font-display text-2xl text-center mb-7">
            {report.todaysRitual.title}
          </h3>
          {report.todaysRitual.steps.map((s, i) => (
            <div key={i} className="grid grid-cols-[30px_1fr] gap-3 mb-4 items-start">
              <span className="font-display italic text-mute">{toRoman(i + 1)}</span>
              <span className="font-display text-base leading-relaxed">{s}</span>
            </div>
          ))}
        </div>

        {/* Seasonal note */}
        <div className="bg-cream p-6 text-center mb-10">
          <p className="font-display italic text-base text-soft-ink leading-relaxed">
            {report.seasonalNote}
          </p>
        </div>

        {/* CTA */}
        <Link href={`/${locale}/home`} className="block w-full bg-ink text-bone py-5 text-center text-[11px] uppercase tracking-[0.32em] mb-4">
          Gå til din Toneup
        </Link>

        <Link href={`/${locale}/share/palette`} className="block w-full text-soft-ink py-2 text-center text-[11px] uppercase tracking-[0.24em]">
          Del paletten din
        </Link>

        <p className="text-[10px] tracking-wider text-mute mt-12 text-center leading-relaxed max-w-xs mx-auto">
          {t("disclaimer.cosmetic_only")}
        </p>
      </div>
    </main>
  );
}

function computeSeason(): "spring" | "summer" | "autumn" | "winter" {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}

function toRoman(n: number): string {
  return ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][n - 1] ?? String(n);
}
