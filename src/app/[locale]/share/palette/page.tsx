"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function SharePalettePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [svg, setSvg] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/share/palette", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // server will look up user's actual palette
    });
    const data = await res.json();
    setSvg(data.svg);
    setShareUrl(data.publicUrl);
    setLoading(false);
  }

  function download() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "toneup-palette.svg";
    a.click();
  }

  return (
    <main className="min-h-screen bg-bone">
      <div className="max-w-md mx-auto px-7 py-10">
        <div className="text-center mb-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            Del din palett
          </div>
          <h1 className="font-display text-4xl tracking-wide2 mb-2">
            Et bilde verdt<br />et øyeblikk
          </h1>
          <p className="font-display italic text-soft-ink text-base mt-3">
            Et kort skapt for Instagram, i Toneups språk.
          </p>
        </div>

        {!svg ? (
          <div className="text-center">
            <div className="bg-cream aspect-[4/5] mb-7 flex items-center justify-center">
              <p className="font-display italic text-mute">Forhåndsvisning</p>
            </div>
            <button onClick={generate} disabled={loading} className="btn-primary disabled:opacity-40">
              {loading ? "Skaper kortet…" : "Lag mitt palette-kort"}
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-7 border border-stone/40" dangerouslySetInnerHTML={{ __html: svg }} />
            <button onClick={download} className="btn-primary mb-3">
              Last ned (SVG)
            </button>
            {shareUrl && (
              <button onClick={() => navigator.clipboard.writeText(shareUrl)}
                className="w-full text-center py-4 border border-ink text-[11px] uppercase tracking-[0.32em]">
                Kopier lenke
              </button>
            )}
          </div>
        )}

        <p className="text-[10px] tracking-wider text-mute text-center mt-12 leading-relaxed">
          Vi deler aldri din palett uten ditt valg.<br />
          Bare du bestemmer hvem som ser hudens reise.
        </p>
      </div>
    </main>
  );
}
