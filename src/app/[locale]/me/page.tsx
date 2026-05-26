import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import { getUserSubscription, isProTier } from "@/lib/subscriptions";
import { brand } from "@/lib/brand";
import BottomNav from "@/components/BottomNav";

export default async function MePage({
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

  const sub = await getUserSubscription(supabase, user.id);
  const isPro = isProTier(sub);

  const { count: bagCount } = await supabase
    .from("makeup_bag_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: logCount } = await supabase
    .from("skin_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: analysisCount } = await supabase
    .from("skin_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: lovedCount } = await supabase
    .from("makeup_bag_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("loved", true);

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-6 pt-10">

        {/* Profile header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 bg-ink text-bone flex items-center justify-center font-display text-xl flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-1">
              Min profil
            </div>
            <h1 className="font-display text-3xl leading-tight tracking-wide2">
              {profile?.display_name || "Hei"}
            </h1>
            <p className="font-display italic text-soft-ink text-sm">
              {user.email}
            </p>
          </div>
        </div>

        {/* Stats */}
        <section className="mb-8">
          <div className="editorial-eyebrow mb-4">Din reise</div>
          <div className="grid grid-cols-4 gap-2">
            <StatTile value={analysisCount ?? 0} label="Analyser" href={`/${locale}/me/analyses`} />
            <StatTile value={logCount ?? 0} label="Logger" href={`/${locale}/me/logs`} />
            <StatTile value={bagCount ?? 0} label="Produkter" href={`/${locale}/bag`} />
            <StatTile value={lovedCount ?? 0} label="Elsket" href={`/${locale}/bag?tab=loved`} accent />
          </div>
        </section>

        {/* Skin profile */}
        {profile && (
          <section className="mb-8">
            <div className="flex justify-between items-baseline mb-4">
              <div className="editorial-eyebrow">Din hudprofil</div>
              <Link
                href={`/${locale}/me/profile`}
                className="text-[10px] uppercase tracking-[0.28em] text-soft-ink underline underline-offset-4"
              >
                Rediger
              </Link>
            </div>
            <div className="border border-stone/40 px-5 py-5 space-y-4">

              {/* Skin type */}
              {profile.skin_type && (
                <ProfileRow label="Hudtype" value={skinTypeLabel(profile.skin_type)} />
              )}

              {/* Skin goals */}
              {profile.skin_goals?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-mute mb-2">
                    Hudmål
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skin_goals.map((g: string) => (
                      <span
                        key={g}
                        className="px-3 py-1 border border-stone/40 text-xs font-display text-soft-ink"
                      >
                        {goalLabel(g)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* What they want help with */}
              {profile.help_with?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-mute mb-2">
                    Fokusområder
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.help_with.map((h: string) => (
                      <span
                        key={h}
                        className="px-3 py-1 border border-stone/40 text-xs font-display text-soft-ink"
                      >
                        {helpWithLabel(h)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferences */}
              <div className="flex flex-wrap gap-3">
                {profile.preferences?.budget && (
                  <ProfileBadge value={budgetLabel(profile.preferences.budget)} />
                )}
                {profile.preferences?.fragrance_free && (
                  <ProfileBadge value="Parfymefritt" />
                )}
                {profile.preferences?.vegan && (
                  <ProfileBadge value="Vegansk" />
                )}
              </div>

              {/* Life phase */}
              {profile.life_phase && profile.life_phase !== "none" && (
                <ProfileRow label="Livsfase" value={lifePhaseLabel(profile.life_phase)} />
              )}

              {/* Gender — shown only if not "prefer_not_to_say" */}
              {profile.gender && profile.gender !== "prefer_not_to_say" && (
                <ProfileRow label="Identifiserer som" value={genderLabel(profile.gender)} />
              )}
            </div>
          </section>
        )}

        {/* Subscription */}
        <section className="mb-8">
          <div className="editorial-eyebrow mb-4">Abonnement</div>
          <div
            className={`px-5 py-5 ${
              isPro ? "border-2 border-ink bg-cream" : "border border-stone/40"
            }`}
          >
            <div
              className="text-[10px] uppercase tracking-[0.4em] mb-2"
              style={{ color: isPro ? brand.accentColor : "#8A8278" }}
            >
              {isPro ? `${brand.name} Pro` : `${brand.name} Free`}
            </div>
            <div className="font-display text-2xl mb-3">
              {isPro
                ? sub.tier === "pro_annual"
                  ? "Årsabonnement"
                  : "Månedlig"
                : "Gratis konto"}
            </div>
            {sub.status === "trialing" && (
              <p className="font-display italic text-sm text-soft-ink mb-3">
                Prøveperiode til {sub.trialEndsAt?.toLocaleDateString("nb-NO")}
              </p>
            )}
            {sub.currentPeriodEnd && (
              <p className="font-display italic text-xs text-mute mb-4">
                {sub.status === "active" ? "Fornyes" : "Slutter"}:{" "}
                {sub.currentPeriodEnd.toLocaleDateString("nb-NO")}
              </p>
            )}
            {isPro ? (
              <form action="/api/subscriptions/portal" method="POST">
                <button
                  type="submit"
                  className="text-[11px] uppercase tracking-[0.32em] underline underline-offset-4"
                >
                  Administrer abonnement
                </button>
              </form>
            ) : (
              <Link
                href={`/${locale}/upgrade`}
                className="inline-block bg-ink text-bone px-5 py-3 text-[11px] uppercase tracking-[0.32em]"
              >
                Se Pro · 14 dager gratis
              </Link>
            )}
          </div>
        </section>

        {/* Settings */}
        <section className="mb-8">
          <div className="editorial-eyebrow mb-4">Innstillinger</div>
          <div className="border-y border-stone/30">
            <SettingsRow href={`/${locale}/me/profile`} label="Profil og preferanser" />
            <SettingsRow
              href={`/${locale}/me/language`}
              label="Språk"
              detail={locale === "no" ? "Norsk" : locale.toUpperCase()}
            />
            <SettingsRow href={`/${locale}/season`} label="Sesongprofil" detail="→" />
            <SettingsRow href={`/${locale}/me/privacy`} label="Personvern og data" />
            <SettingsRow href={`/${locale}/me/about`} label={`Om ${brand.name}`} last />
          </div>
        </section>

        <form action="/api/auth/sign-out" method="POST">
          <button
            type="submit"
            className="w-full text-center py-4 text-[11px] uppercase tracking-[0.32em] text-soft-ink"
          >
            Logg ut
          </button>
        </form>

        <p className="text-[10px] tracking-wider text-mute text-center mt-10 leading-relaxed">
          {brand.name} · v{brand.version} · {brand.year}
        </p>
      </div>

      <BottomNav locale={locale} />
    </main>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatTile({
  value,
  label,
  accent = false,
  href,
}: {
  value: number;
  label: string;
  accent?: boolean;
  href?: string;
}) {
  const inner = (
    <>
      <div className={`font-display text-2xl ${accent && value > 0 ? "text-accent" : ""}`}>
        {value}
      </div>
      <div className="text-[9px] uppercase tracking-wider text-mute mt-1 leading-tight">
        {label}
      </div>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="bg-cream px-3 py-4 text-center block hover:opacity-70 transition-opacity">
        {inner}
      </Link>
    );
  }
  return <div className="bg-cream px-3 py-4 text-center">{inner}</div>;
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-[10px] uppercase tracking-[0.3em] text-mute">{label}</span>
      <span className="font-display text-base text-ink">{value}</span>
    </div>
  );
}

function ProfileBadge({ value }: { value: string }) {
  return (
    <span className="px-3 py-1 bg-stone/30 text-[10px] uppercase tracking-[0.2em] text-soft-ink">
      {value}
    </span>
  );
}

function SettingsRow({
  href,
  label,
  detail,
  last = false,
}: {
  href: string;
  label: string;
  detail?: string;
  last?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex justify-between items-center py-4 ${
        !last ? "border-b border-stone/30" : ""
      }`}
    >
      <span className="font-display">{label}</span>
      <span className="font-display italic text-soft-ink text-sm">
        {detail ?? "→"}
      </span>
    </Link>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function skinTypeLabel(key: string): string {
  const m: Record<string, string> = {
    dry: "Tørr", oily: "Fet", combination: "Kombinert",
    normal: "Normal", sensitive: "Sensitiv", unknown: "Vet ikke",
  };
  return m[key] ?? key;
}

function goalLabel(key: string): string {
  const m: Record<string, string> = {
    less_dryness: "Mindre tørrhet", glow: "Glød", less_acne: "Mindre akne",
    even_tone: "Jevnere hudtone", less_sensitivity: "Mindre sensitivitet",
    anti_aging: "Anti-aging", pore_minimizing: "Porer",
  };
  return m[key] ?? key;
}

function helpWithLabel(key: string): string {
  const m: Record<string, string> = {
    skincare: "Hudpleie", foundation: "Foundation", concealer: "Concealer",
    blush: "Blush", contour: "Contour", lip: "Lepper", eye: "Øyne",
  };
  return m[key] ?? key;
}

function budgetLabel(key: string): string {
  const m: Record<string, string> = {
    budget: "Rimelig", mid: "Mellompris", premium: "Premium", luxury: "Luksus",
  };
  return m[key] ?? key;
}

function lifePhaseLabel(key: string): string {
  const m: Record<string, string> = {
    menstrual_cycle: "Syklussporing aktiv",
    pregnancy: "Gravid",
    breastfeeding: "Ammer",
    menopause: "Overgangsalder",
    other: "Annet",
  };
  return m[key] ?? key;
}

function genderLabel(key: string): string {
  const m: Record<string, string> = {
    female: "Kvinne", male: "Mann", non_binary: "Ikke-binær", other: "Annet",
  };
  return m[key] ?? key;
}
