"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

const locales = [
  { code: "no", label: "Norsk" },
  { code: "da", label: "Dansk" },
  { code: "sv", label: "Svenska" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
] as const;

export function LanguageSelector({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function change(locale: string) {
    const segments = pathname.split("/");
    segments[1] = locale; // replace locale segment
    router.push(segments.join("/"));
    setOpen(false);
  }

  const current = locales.find((l) => l.code === currentLocale) ?? locales[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[10px] uppercase tracking-[0.32em] text-soft-ink hover:text-ink transition-colors flex items-center gap-2"
      >
        {current.code.toUpperCase()}
        <span className="text-mute">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-3 bg-bone border border-stone/40 py-2 min-w-[140px] z-50">
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => change(l.code)}
              className="block w-full text-left px-4 py-2 text-xs font-display hover:bg-cream transition-colors"
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
