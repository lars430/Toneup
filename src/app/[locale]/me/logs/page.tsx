import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

const FEEL_LABELS: Record<string, string> = {
  radiant: "Strålende", balanced: "Balansert", tired: "Trett",
  tight: "Stram", reactive: "Reaktiv", oily: "Glinsende",
};

const TAG_LABELS: Record<string, string> = {
  breakout: "Urenhet", dry_patches: "Tørre flekker", redness: "Rødhet",
  smooth: "Glatt", good_foundation: "Foundation satt godt",
  bad_foundation: "Foundation satt dårlig", slept_well: "Sov godt", stressed: "Stresset",
};

export default async function LogsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: logs } = await supabase
    .from("skin_logs")
    .select("id, logged_at, feel_label, dryness, redness, glow, sensitivity, breakouts, tags, free_text")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(90);

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-6 pt-10">

        <header className="flex items-center gap-4 mb-9">
          <Link href={`/${locale}/me`} className="text-[10px] uppercase tracking-[0.32em] text-soft-ink">←</Link>
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-1">Din reise</div>
            <h1 className="font-display text-3xl leading-tight tracking-wide2">Hudlogger</h1>
          </div>
        </header>

        {!logs || logs.length === 0 ? (
          <div className="bg-cream px-5 py-8 text-center">
            <div className="font-display text-base mb-2">Ingen logger ennå</div>
            <p className="font-display italic text-sm text-soft-ink mb-5 leading-relaxed">
              Begynn å logge huden daglig for å se mønstre over tid.
            </p>
            <Link
              href={`/${locale}/skin-log`}
              className="inline-block bg-ink text-bone px-6 py-3 text-[11px] uppercase tracking-[0.32em]"
            >
              Logg huden nå
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const metrics = [
                log.dryness && { label: "Fukt", value: log.dryness },
                log.redness && { label: "Rødhet", value: log.redness },
                log.glow && { label: "Glød", value: log.glow },
              ].filter(Boolean) as { label: string; value: number }[];

              return (
                <div key={log.id} className="bg-cream px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-display text-base">
                        {FEEL_LABELS[log.feel_label] ?? log.feel_label ?? "—"}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.28em] text-mute mt-0.5">
                        {formatDate(log.logged_at)}
                      </div>
                    </div>
                    {metrics.length > 0 && (
                      <div className="flex gap-3">
                        {metrics.map((m) => (
                          <div key={m.label} className="text-right">
                            <div className="text-[9px] uppercase tracking-wider text-mute">{m.label}</div>
                            <div className="font-display text-sm">{m.value}/5</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {(log.tags?.length > 0 || log.free_text) && (
                    <div className="border-t border-stone/20 pt-2 mt-2">
                      {log.tags?.length > 0 && (
                        <div className="font-display italic text-xs text-soft-ink">
                          {log.tags.map((t: string) => TAG_LABELS[t] ?? t).join(" · ")}
                        </div>
                      )}
                      {log.free_text && (
                        <div className="font-display text-xs text-soft-ink mt-1 leading-relaxed">
                          "{log.free_text}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {logs && logs.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href={`/${locale}/skin-log`}
              className="inline-block border border-stone/40 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-soft-ink hover:border-ink transition-colors"
            >
              Logg i dag
            </Link>
          </div>
        )}
      </div>

      <BottomNav locale={locale} />
    </main>
  );
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("nb-NO", {
    weekday: "long", day: "numeric", month: "long",
  });
}
