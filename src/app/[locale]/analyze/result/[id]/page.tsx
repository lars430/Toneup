import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";

export default async function AnalysisResultPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const { data: analysis } = await supabase
    .from("skin_analyses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!analysis) redirect(`/${locale}/home`);

  const result = analysis.raw_result ?? {};
  const metrics = result.metrics ?? {};
  const concerns = result.concerns ?? [];
  const raw = result.raw ?? {};
  const undertone = raw.undertone ?? "neutral";
  const depth = raw.depth ?? "medium";

  const undertoneLabel: Record<string, string> = { warm: "Varm", cool: "Kjølig", neutral: "Nøytral" };
  const depthLabel: Record<string, string> = { fair: "Lys", light: "Lys-medium", medium: "Medium", tan: "Tan", deep: "Dyp" };
  const hexColor = raw.correctedSkinRgb ? rgbToHex(raw.correctedSkinRgb) : "#C8A882";

  return (
    <main className="min-h-screen bg-bone pb-32">
      <div className="max-w-md mx-auto px-7 py-10">

        <header className="flex justify-between items-center mb-10">
          <Link href={`/${locale}/home`} className="text-[11px] uppercase tracking-[0.24em] text-soft-ink">
            Hjem
          </Link>
          <span className="text-[10px] uppercase tracking-[0.32em] text-mute">Analyseresultat</span>
          <span className="w-12" />
        </header>

        <div className="divider-line mb-10" />

        {/* Skin tone swatch */}
        <div className="flex items-end gap-6 mb-10">
          <div className="w-20 h-20 flex-shrink-0" style={{ backgroundColor: hexColor }} />
          <div>
            <h1 className="font-display text-3xl leading-tight tracking-wide2 mb-1">
              Din hudpalett
            </h1>
            <p className="font-display italic text-soft-ink text-base">
              {undertoneLabel[undertone] ?? undertone} undertone · {depthLabel[depth] ?? depth} dybde
            </p>
          </div>
        </div>

        {/* Metrics */}
        {Object.keys(metrics).length > 0 && (
          <section className="mb-10">
            <div className="editorial-eyebrow mb-5">Hudmålinger</div>
            <div className="space-y-5">
              {[
                { label: "Rødhet", value: metrics.redness },
                { label: "Glød", value: metrics.radiance },
                { label: "Jevnhet", value: metrics.evenness },
              ].filter((m) => m.value != null).map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-display text-sm">{m.label}</span>
                    <span className="text-[11px] text-mute">{Math.round(m.value * 100)}%</span>
                  </div>
                  <div className="h-px bg-stone/30">
                    <div className="h-px bg-ink" style={{ width: `${m.value * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Concerns */}
        {concerns.length > 0 && (
          <section className="mb-10">
            <div className="editorial-eyebrow mb-5">Vi merket</div>
            <div className="space-y-3">
              {concerns.map((c: { key: string; severity: number; confidence: number }) => (
                <div key={c.key} className="bg-cream p-5">
                  <div className="font-display text-base mb-1">{concernLabel(c.key)}</div>
                  <div className="font-display italic text-xs text-soft-ink">
                    Alvorlighetsgrad {Math.round(c.severity * 100)}% · Sikkerhet {Math.round(c.confidence * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* No concerns */}
        {concerns.length === 0 && (
          <section className="mb-10">
            <div className="bg-cream p-6 text-center">
              <div className="font-display text-lg mb-2">Ingen bekymringer funnet</div>
              <div className="font-display italic text-soft-ink text-sm">Huden din ser balansert ut.</div>
            </div>
          </section>
        )}

        <div className="space-y-3">
          <Link href={`/${locale}/analyze/calibrate`}
            className="block w-full bg-ink text-bone py-5 text-center text-[11px] uppercase tracking-[0.32em]">
            Ta ny analyse
          </Link>
          <Link href={`/${locale}/home`}
            className="block w-full text-soft-ink py-3 text-center text-[11px] uppercase tracking-[0.24em]">
            Til forsiden
          </Link>
        </div>

        <p className="text-[10px] tracking-wider text-mute text-center mt-12 leading-relaxed">
          Analysen er kosmetisk veiledning, ikke medisinsk diagnose.
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

function rgbToHex([r, g, b]: [number, number, number]): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function concernLabel(key: string): string {
  const labels: Record<string, string> = {
    redness: "Rødhet",
    uneven_tone: "Ujevn hudtone",
    dullness: "Matt hud",
    dehydration: "Dehydrering",
    breakout: "Uren hud",
  };
  return labels[key] ?? key;
}
