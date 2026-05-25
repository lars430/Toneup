import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import { getUserSubscription, isProTier } from "@/lib/subscriptions";

export default async function GalleryPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const sub = await getUserSubscription(supabase, user.id);
  if (!isProTier(sub)) {
    return <UpgradeGate locale={locale} />;
  }

  const { data: snapshots } = await supabase
    .from("palette_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("taken_at", { ascending: false });

  return (
    <main className="min-h-screen bg-bone pb-24">
      <div className="max-w-md mx-auto px-7 py-10">
        <div className="text-center mb-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            Hudens reise
          </div>
          <h1 className="font-display text-4xl leading-tight tracking-wide2 mb-2">
            Før og etter
          </h1>
          <p className="font-display italic text-soft-ink text-base">
            En stille kronikk av forandring.
          </p>
        </div>

        {!snapshots || snapshots.length === 0 ? (
          <div className="text-center py-12">
            <div className="divider-line mx-auto mb-7" />
            <p className="font-display italic text-soft-ink text-base mb-7">
              Galleriet er ennå tomt.<br />
              Etter din neste analyse, kan du arkivere et øyeblikksbilde her.
            </p>
            <Link href={`/${locale}/analyze/calibrate`} className="btn-primary inline-block w-auto px-8">
              Gjør en analyse
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {snapshots.map((s: any) => (
              <Link key={s.id} href={`/${locale}/gallery/${s.id}`}
                className="block">
                <div className="aspect-square mb-3" style={{ background: s.hex_color || "#D9CFC1" }} />
                <div className="font-display text-sm mb-1">{s.shade_label}</div>
                <div className="font-display italic text-xs text-soft-ink">
                  {new Date(s.taken_at).toLocaleDateString(locale === "no" ? "nb-NO" : locale, {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}

        {snapshots && snapshots.length > 1 && (
          <Link href={`/${locale}/gallery/compare`}
            className="block mt-10 text-center py-4 border border-ink text-[11px] uppercase tracking-[0.32em]">
            Sammenlign over tid
          </Link>
        )}
      </div>
    </main>
  );
}

function UpgradeGate({ locale }: { locale: string }) {
  return (
    <main className="min-h-screen bg-bone flex items-center justify-center p-7">
      <div className="max-w-sm text-center">
        <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">
          Pro-funksjon
        </div>
        <h1 className="font-display text-4xl tracking-wide2 mb-4">
          Før og etter
        </h1>
        <p className="font-display italic text-soft-ink text-base mb-8 leading-relaxed">
          Galleriet over hudens reise er en del av Toneup Pro.
          Se forandring som ingen andre apper kan vise deg.
        </p>
        <Link href={`/${locale}/upgrade`} className="btn-primary inline-block w-auto px-10">
          Se Pro
        </Link>
      </div>
    </main>
  );
}
