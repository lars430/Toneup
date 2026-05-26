import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import BottomNav from "@/components/BottomNav";

export default async function AnalysesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: analyses } = await supabase
    .from("skin_analyses")
    .select("id, taken_at, raw_result, summary")
    .eq("user_id", user.id)
    .order("taken_at", { ascending: false });

  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-6 pt-10">

        <header className="flex items-center gap-4 mb-9">
          <Link
            href={`/${locale}/me`}
            className="text-[10px] uppercase tracking-[0.32em] text-soft-ink"
          >
            ←
          </Link>
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-1">
              Din reise
            </div>
            <h1 className="font-display text-3xl leading-tight tracking-wide2">
              Analyser
            </h1>
          </div>
        </header>

        {!analyses || analyses.length === 0 ? (
          <div className="bg-cream px-5 py-8 text-center">
            <div className="font-display text-base mb-2">Ingen analyser ennå</div>
            <p className="font-display italic text-sm text-soft-ink mb-5 leading-relaxed">
              Start din første hudanalyse for å se din fargepalett og hudtilstand.
            </p>
            <Link
              href={`/${locale}/analyze/calibrate`}
              className="inline-block bg-ink text-bone px-6 py-3 text-[11px] uppercase tracking-[0.32em]"
            >
              Start Ritual N° 01
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((a, i) => {
              const raw = a.raw_result ?? {};
              const undertone = raw.undertone ?? raw.raw?.undertone ?? null;
              const depth = raw.depth ?? raw.raw?.depth ?? null;
              const hexColor = raw.correctedSkinRgb
                ? rgbToHex(raw.correctedSkinRgb)
                : raw.raw?.correctedSkinRgb
                ? rgbToHex(raw.raw.correctedSkinRgb)
                : "#C8A882";

              return (
                <Link
                  key={a.id}
                  href={`/${locale}/analyze/result/${a.id}`}
                  className="flex items-center gap-5 bg-cream px-5 py-4 group"
                >
                  <div
                    className="w-12 h-12 flex-shrink-0"
                    style={{ backgroundColor: hexColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base">
                      {i === 0 ? "Siste analyse" : `Analyse ${analyses.length - i}`}
                    </div>
                    <div className="font-display italic text-xs text-soft-ink mt-0.5">
                      {[undertoneLabel(undertone), depthLabel(depth)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-mute mt-1">
                      {formatDate(a.taken_at)}
                    </div>
                  </div>
                  <span className="text-mute group-hover:text-ink transition-colors">→</span>
                </Link>
              );
            })}
          </div>
        )}

        {analyses && analyses.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href={`/${locale}/analyze/calibrate`}
              className="inline-block border border-stone/40 px-6 py-3 text-[11px] uppercase tracking-[0.32em] text-soft-ink hover:border-ink transition-colors"
            >
              Ny analyse
            </Link>
          </div>
        )}
      </div>

      <BottomNav locale={locale} />
    </main>
  );
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function undertoneLabel(key?: string | null): string {
  const m: Record<string, string> = {
    warm: "Varm", cool: "Kjølig", neutral: "Nøytral",
  };
  return key ? (m[key] ?? "") : "";
}

function depthLabel(key?: string | null): string {
  const m: Record<string, string> = {
    fair: "Lys", light: "Lys-medium", medium: "Medium", tan: "Tan", deep: "Dyp",
  };
  return key ? (m[key] ?? "") : "";
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
