"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SkinFeel = "radiant" | "balanced" | "tired" | "tight" | "reactive" | "oily";

const FEELS: Array<{ key: SkinFeel; label: string; sub: string }> = [
  { key: "radiant",  label: "Strålende", sub: "Glød, livfull, balansert" },
  { key: "balanced", label: "Balansert",  sub: "Rolig, harmonisk" },
  { key: "tired",    label: "Trett",      sub: "Matt, livløs" },
  { key: "tight",    label: "Stram",      sub: "Tørr, ber om fukt" },
  { key: "reactive", label: "Reaktiv",    sub: "Rød, varm, ubekvem" },
  { key: "oily",     label: "Glinsende",  sub: "Fet, særlig T-sone" },
];

const TAGS = [
  { key: "breakout",        label: "Urenhet" },
  { key: "dry_patches",     label: "Tørre flekker" },
  { key: "redness",         label: "Rødhet" },
  { key: "smooth",          label: "Glatt" },
  { key: "good_foundation", label: "Foundation satt godt" },
  { key: "bad_foundation",  label: "Foundation satt dårlig" },
  { key: "slept_well",      label: "Sov godt" },
  { key: "stressed",        label: "Stresset" },
];

export default function SkinLogPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [feel, setFeel] = useState<SkinFeel | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleTag(key: string) {
    setTags((prev) => (prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]));
  }

  async function save() {
    if (!feel) return;
    setSaving(true);
    const res = await fetch("/api/skin-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feel, tags, freeText: note }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => router.push(`/${locale}/home`), 1500);
    }
    setSaving(false);
  }

  if (saved) {
    return (
      <main className="min-h-screen bg-bone flex items-center justify-center p-8">
        <div className="text-center">
          <div className="divider-line mx-auto mb-8" />
          <h1 className="font-display text-4xl tracking-wide2 mb-3">Logget.</h1>
          <p className="font-display italic text-soft-ink text-lg">Vi ser deg.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bone pb-32">
      {/* Header with back button */}
      <header className="flex justify-between items-center px-7 pt-10 pb-6">
        <Link href={`/${locale}/home`}
          className="text-[11px] uppercase tracking-[0.24em] text-soft-ink">
          ← Hjem
        </Link>
        <span className="text-[10px] uppercase tracking-[0.32em] text-mute">Hudlogg</span>
        <span className="w-12" />
      </header>

      <div className="px-7">
        {/* Date eyebrow */}
        <div className="text-center mb-8">
          <div className="font-display italic text-sm text-mute mb-1">
            {formatDate(locale)}
          </div>
          <h1 className="font-display text-4xl leading-tight tracking-wide2 mb-2">
            Hvordan kjennes<br />huden i dag?
          </h1>
          <p className="font-display italic text-soft-ink text-base mt-3">
            Velg ett. Du kan endre senere.
          </p>
        </div>

        {/* Feel choices */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {FEELS.map((f) => (
            <button key={f.key} onClick={() => setFeel(f.key)}
              className={`text-left p-5 border transition-all ${
                feel === f.key
                  ? "border-ink bg-ink text-bone"
                  : "border-stone/40 hover:border-ink"
              }`}>
              <div className="font-display text-xl mb-1">{f.label}</div>
              <div className={`text-xs leading-relaxed ${
                feel === f.key ? "text-bone/70" : "text-soft-ink"
              }`}>
                {f.sub}
              </div>
            </button>
          ))}
        </div>

        {/* Tags */}
        <div className="mb-10">
          <div className="editorial-eyebrow mb-3 text-center">Eller noe spesifikt</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {TAGS.map((tg) => (
              <button key={tg.key} onClick={() => toggleTag(tg.key)}
                className={`px-3 py-2 border text-xs font-display transition-colors ${
                  tags.includes(tg.key)
                    ? "border-ink bg-ink text-bone"
                    : "border-stone/40 text-soft-ink"
                }`}>
                {tg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Free text note */}
        <div className="mb-12">
          <div className="editorial-eyebrow mb-3 text-center">Egne ord</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Frivillig"
            className="w-full bg-cream border-none p-4 font-display italic text-base text-ink placeholder:text-mute resize-none focus:outline-none focus:ring-1 focus:ring-ink"
            rows={3}
          />
        </div>

        <button onClick={save} disabled={!feel || saving}
          className="btn-primary disabled:opacity-40">
          {saving ? "Lagrer…" : "Lagre dagens logg"}
        </button>
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bone border-t border-stone/30">
        <div className="max-w-md mx-auto flex">
          {[
            { href: `/${locale}/home`,     label: "Hjem" },
            { href: `/${locale}/skin-log`, label: "Logg" },
            { href: `/${locale}/bag`,      label: "Pung" },
            { href: `/${locale}/me`,       label: "Meg" },
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

function formatDate(locale: string): string {
  return new Date().toLocaleDateString(locale === "no" ? "nb-NO" : locale, {
    weekday: "long", day: "numeric", month: "long",
  });
}
