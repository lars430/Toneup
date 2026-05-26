"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  itemId: string;
}

type State = "idle" | "confirm" | "loading" | "error";

export default function RemoveBagItem({ itemId }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");

  async function remove() {
    setState("loading");
    const res = await fetch("/api/bag/add", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setState("error");
    }
  }

  if (state === "idle") {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setState("confirm");
        }}
        aria-label="Fjern fra pung"
        className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-mute hover:text-accent text-base transition-colors"
      >
        ×
      </button>
    );
  }

  return (
    <div className="flex-shrink-0 flex items-center gap-1">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          remove();
        }}
        disabled={state === "loading"}
        className="px-3 py-1.5 bg-ink text-bone text-[9px] uppercase tracking-[0.24em] disabled:opacity-50"
      >
        {state === "loading" ? "…" : state === "error" ? "Prøv" : "Fjern"}
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setState("idle");
        }}
        disabled={state === "loading"}
        aria-label="Avbryt"
        className="w-7 h-7 flex items-center justify-center text-mute hover:text-ink text-base"
      >
        ↺
      </button>
    </div>
  );
}
