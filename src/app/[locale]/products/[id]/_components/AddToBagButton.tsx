"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  productId: string;
  locale: string;
  alreadyInBag: boolean;
  bagItemId: string | null;
}

type State =
  | "idle"          // not in bag, ready to add
  | "loading-add"
  | "in-bag"        // currently in bag
  | "confirm-remove"
  | "loading-remove"
  | "removed"       // just removed
  | "error";

export default function AddToBagButton({
  productId,
  locale,
  alreadyInBag,
  bagItemId,
}: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>(alreadyInBag ? "in-bag" : "idle");
  const [currentItemId, setCurrentItemId] = useState<string | null>(bagItemId);

  async function add() {
    setState("loading-add");
    const res = await fetch("/api/bag/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      router.refresh();
      setState("in-bag");
    } else if (res.status === 409) {
      setState("in-bag");
    } else {
      setState("error");
    }
  }

  async function remove() {
    if (!currentItemId) return;
    setState("loading-remove");
    const res = await fetch("/api/bag/add", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: currentItemId }),
    });
    if (res.ok) {
      setCurrentItemId(null);
      setState("removed");
      router.refresh();
    } else {
      setState("error");
    }
  }

  if (state === "in-bag") {
    return (
      <div className="space-y-3">
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
        <button
          onClick={() => setState("confirm-remove")}
          className="block mx-auto text-[10px] uppercase tracking-[0.28em] text-mute hover:text-accent underline underline-offset-4"
        >
          Fjern fra pung
        </button>
      </div>
    );
  }

  if (state === "confirm-remove" || state === "loading-remove") {
    return (
      <div className="border border-stone/40 px-5 py-4">
        <p className="font-display italic text-sm text-soft-ink mb-4 text-center">
          Fjerne dette produktet fra pungen?
        </p>
        <div className="flex gap-2">
          <button
            onClick={remove}
            disabled={state === "loading-remove"}
            className="flex-1 bg-ink text-bone py-3 text-[11px] uppercase tracking-[0.32em] disabled:opacity-50"
          >
            {state === "loading-remove" ? "Fjerner…" : "Bekreft"}
          </button>
          <button
            onClick={() => setState("in-bag")}
            disabled={state === "loading-remove"}
            className="px-5 py-3 border border-stone/40 text-[10px] uppercase tracking-[0.28em] text-soft-ink"
          >
            Avbryt
          </button>
        </div>
      </div>
    );
  }

  if (state === "removed") {
    return (
      <div className="space-y-3">
        <div className="text-center py-3 bg-cream text-[11px] uppercase tracking-[0.32em] text-soft-ink">
          Fjernet fra pungen
        </div>
        <button onClick={add} className="btn-primary w-full">
          + Legg til igjen
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={add}
      disabled={state === "loading-add"}
      className="btn-primary w-full disabled:opacity-40"
    >
      {state === "loading-add"
        ? "Legger til…"
        : state === "error"
        ? "Prøv igjen"
        : "+ Legg til i sminkepung"}
    </button>
  );
}
