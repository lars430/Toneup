"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  itemId: string;
  currentShadeName?: string | null;
  currentShadeCode?: string | null;
}

export default function SetShadeButton({
  itemId,
  currentShadeName,
  currentShadeCode,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shadeName, setShadeName] = useState(currentShadeName ?? "");
  const [shadeCode, setShadeCode] = useState(currentShadeCode ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch("/api/bag/item", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, shade_name: shadeName, shade_code: shadeCode }),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[9px] uppercase tracking-[0.24em] text-mute hover:text-soft-ink transition-colors mt-1"
      >
        {currentShadeName ? "Endre shade" : "Angi shade"}
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <input
        type="text"
        value={shadeName}
        onChange={(e) => setShadeName(e.target.value)}
        placeholder="Shade-navn (f.eks. NC15)"
        className="w-full bg-bone border border-stone/40 px-3 py-2 text-xs font-display focus:outline-none focus:ring-1 focus:ring-ink"
      />
      <input
        type="text"
        value={shadeCode}
        onChange={(e) => setShadeCode(e.target.value)}
        placeholder="Kode / nummer (valgfritt)"
        className="w-full bg-bone border border-stone/40 px-3 py-2 text-xs font-display focus:outline-none focus:ring-1 focus:ring-ink"
      />
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 bg-ink text-bone py-2 text-[10px] uppercase tracking-[0.24em] disabled:opacity-50"
        >
          {saving ? "Lagrer…" : "Lagre"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2 border border-stone/40 text-[10px] uppercase tracking-[0.24em] text-soft-ink"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}
