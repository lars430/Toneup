"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  productId: string;
  locale: string;
  alreadyInBag: boolean;
}

export default function AddToBagButton({ productId, locale, alreadyInBag }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    alreadyInBag ? "done" : "idle"
  );

  async function add() {
    if (state !== "idle") return;
    setState("loading");
    const res = await fetch("/api/bag/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      setState("done");
      router.refresh();
    } else if (res.status === 409) {
      setState("done");
    } else {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-3">
        <span className="flex-1 text-center py-3 bg-cream text-[11px] uppercase tracking-[0.32em] text-soft-ink">
          I sminkepungen ✓
        </span>
        <a
          href={`/${locale}/bag`}
          className="px-4 py-3 border border-stone/40 text-[10px] uppercase tracking-[0.28em] text-soft-ink hover:border-ink transition-colors"
        >
          Gå til pung
        </a>
      </div>
    );
  }

  return (
    <button
      onClick={add}
      disabled={state === "loading"}
      className="btn-primary w-full disabled:opacity-40"
    >
      {state === "loading" ? "Legger til…" : state === "error" ? "Prøv igjen" : "+ Legg til i sminkepung"}
    </button>
  );
}
