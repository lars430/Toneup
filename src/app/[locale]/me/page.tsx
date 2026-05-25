import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import { getUserSubscription, isProTier } from "@/lib/subscriptions";

export default async function MePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const sub = await getUserSubscription(supabase, user.id);
  const isPro = isProTier(sub);

  // Stats
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

  return (
    <main className="min-h-screen bg-bone pb-32">
      <div className="max-w-md mx-auto px-7 py-10">

        <div className="text-center mb-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            Min profil
          </div>
          <h1 className="font-display text-4xl tracking-wide2 mb-2">
            {profile?.display_name || "Velkommen"}
          </h1>
          <p className="font-display italic text-soft-ink text-sm">
            {user.email}
          </p>
        </div>

        {/* Subscription card */}
        <section className="mb-10">
          <div className={`p-6 ${isPro ? "border-2 border-ink bg-cream" : "border border-stone/40"}`}>
            <div className="text-[10px] uppercase tracking-[0.4em] mb-2"
              style={{ color: isPro ? "#8B6F4E" : "#8A8278" }}>
              {isPro ? "Toneup Pro" : "Toneup Free"}
            </div>
            <div className="font-display text-2xl mb-3">
              {isPro
                ? sub.tier === "pro_annual" ? "Årsabonnement" : "Månedlig"
                : "Gratis konto"}
            </div>
            {sub.status === "trialing" && (
              <p className="font-display italic text-sm text-soft-ink mb-3">
                Prøveperiode til {sub.trialEndsAt?.toLocaleDateString("nb-NO")}
              </p>
            )}
            {sub.currentPeriodEnd && (
              <p className="font-display italic text-xs text-mute">
                {sub.status === "active" ? "Fornyes" : "Slutter"}: {sub.currentPeriodEnd.toLocaleDateString("nb-NO")}
              </p>
            )}
            {isPro ? (
              <form action="/api/subscriptions/portal" method="POST" className="mt-5">
                <button type="submit"
                  className="text-[11px] uppercase tracking-[0.32em] underline">
                  Administrer abonnement
                </button>
              </form>
            ) : (
              <Link href={`/${locale}/upgrade`}
                className="inline-block mt-5 bg-ink text-bone px-5 py-3 text-[11px] uppercase tracking-[0.32em]">
                Se Pro
              </Link>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="mb-10">
          <div className="editorial-eyebrow mb-4">Din reise</div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-cream p-4 text-center">
              <div className="font-display text-3xl">{analysisCount ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-mute mt-1">Analyser</div>
            </div>
            <div className="bg-cream p-4 text-center">
              <div className="font-display text-3xl">{logCount ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-mute mt-1">Logger</div>
            </div>
            <div className="bg-cream p-4 text-center">
              <div className="font-display text-3xl">{bagCount ?? 0}</div>
              <div className="text-[10px] uppercase tracking-wider text-mute mt-1">Produkter</div>
            </div>
          </div>
        </section>

        {/* Settings */}
        <section className="mb-10">
          <div className="editorial-eyebrow mb-4">Innstillinger</div>
          <div className="border-y border-stone/30">
            <Link href={`/${locale}/me/profile`}
              className="flex justify-between items-center py-4 border-b border-stone/30">
              <span className="font-display">Profil og preferanser</span>
              <span className="text-mute">→</span>
            </Link>
            <Link href={`/${locale}/me/language`}
              className="flex justify-between items-center py-4 border-b border-stone/30">
              <span className="font-display">Språk</span>
              <span className="font-display italic text-soft-ink">
                {locale === "no" ? "Norsk" : locale}
              </span>
            </Link>
            <Link href={`/${locale}/me/privacy`}
              className="flex justify-between items-center py-4 border-b border-stone/30">
              <span className="font-display">Personvern og data</span>
              <span className="text-mute">→</span>
            </Link>
            <Link href={`/${locale}/me/about`}
              className="flex justify-between items-center py-4">
              <span className="font-display">Om Toneup</span>
              <span className="text-mute">→</span>
            </Link>
          </div>
        </section>

        <form action="/api/auth/sign-out" method="POST">
          <button type="submit"
            className="w-full text-center py-4 text-[11px] uppercase tracking-[0.32em] text-soft-ink">
            Logg ut
          </button>
        </form>

        <p className="text-[10px] tracking-wider text-mute text-center mt-12 leading-relaxed">
          Toneup · v1.0 · MMXXV
        </p>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bone border-t border-stone/30">
        <div className="max-w-md mx-auto flex">
          {[
            { href: `/${locale}/home`, label: "Hjem" },
            { href: `/${locale}/skin-log`, label: "Logg" },
            { href: `/${locale}/bag`, label: "Pung" },
            { href: `/${locale}/me`, label: "Meg", active: true },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex-1 py-5 text-center text-[10px] uppercase tracking-[0.32em] ${
                item.active ? "text-ink font-medium" : "text-soft-ink"
              }`}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
