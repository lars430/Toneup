"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  id: string;
  brand: string;
  name: string;
  category: string;
  shade_name?: string;
  shade_code?: string;
  attributes?: any;
  price_tier?: string;
}

export default function AddProductPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => search(), 300);
    return () => clearTimeout(timer);
  }, [query, category]);

  async function search() {
    if (!query && !category) {
      setResults([]);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    const res = await fetch(`/api/products/search?${params}`);
    const data = await res.json();
    setResults(data.products || []);
    setLoading(false);
  }

  async function add(productId: string) {
    setAdding(productId);
    const res = await fetch("/api/bag/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      router.push(`/${locale}/bag`);
    }
    setAdding(null);
  }

  const categories = [
    { key: "foundation", label: "Foundation" },
    { key: "concealer", label: "Concealer" },
    { key: "lipstick", label: "Leppestift" },
    { key: "blush", label: "Rouge" },
    { key: "cleanser", label: "Rens" },
    { key: "serum", label: "Serum" },
    { key: "moisturizer", label: "Fuktighet" },
    { key: "spf", label: "SPF" },
  ];

  return (
    <main className="min-h-screen bg-bone pb-24">
      <div className="max-w-md mx-auto px-7 py-10">
        <div className="text-center mb-8">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            Legg til
          </div>
          <h1 className="font-display text-4xl tracking-wide2">
            Søk i katalogen
          </h1>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Merke eller produktnavn…"
          className="w-full bg-cream border-none p-4 font-display text-base mb-4 focus:outline-none focus:ring-1 focus:ring-ink"
        />

        <div className="flex flex-wrap gap-2 mb-7">
          {categories.map((c) => (
            <button key={c.key}
              onClick={() => setCategory(category === c.key ? "" : c.key)}
              className={`px-3 py-2 text-xs font-display border transition-colors ${
                category === c.key
                  ? "border-ink bg-ink text-bone"
                  : "border-stone/40 text-soft-ink"
              }`}>
              {c.label}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-center font-display italic text-mute">Søker…</p>
        )}

        {!loading && results.length === 0 && (query || category) && (
          <p className="text-center font-display italic text-soft-ink py-10">
            Ingen treff. Prøv et annet søkeord.
          </p>
        )}

        {!loading && results.length === 0 && !query && !category && (
          <div className="text-center py-12">
            <p className="font-display italic text-soft-ink leading-relaxed">
              Begynn å skrive et merke eller produkt,<br />
              eller velg en kategori.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {results.map((p) => (
            <button key={p.id} onClick={() => add(p.id)}
              disabled={adding !== null}
              className="w-full text-left bg-cream p-4 hover:bg-stone/30 transition-colors disabled:opacity-50">
              <div className="flex items-start gap-4">
                {p.attributes?.hex && (
                  <div className="w-10 h-10 flex-shrink-0 rounded-full mt-1"
                    style={{ background: p.attributes.hex }} />
                )}
                <div className="flex-1">
                  <div className="font-display text-base">{p.name}</div>
                  <div className="font-display italic text-xs text-soft-ink">
                    {p.brand}
                    {p.shade_name && ` · ${p.shade_name}`}
                    {p.shade_code && ` (${p.shade_code})`}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.32em] text-mute mt-1">
                    {p.category}
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-accent self-center">
                  {adding === p.id ? "Legger til…" : "+ Legg til"}
                </div>
              </div>
            </button>
          ))}
        </div>

        <Link href={`/${locale}/bag`}
          className="block text-center py-4 mt-8 text-[11px] uppercase tracking-[0.32em] text-soft-ink">
          Avbryt
        </Link>
      </div>
    </main>
  );
}
