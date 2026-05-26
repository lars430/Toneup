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
  const [added, setAdded] = useState<Set<string>>(new Set());

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

  async function add(e: React.MouseEvent, productId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(productId);
    const res = await fetch("/api/bag/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok || res.status === 409) {
      setAdded((prev) => new Set(prev).add(productId));
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
            <div key={p.id} className="bg-cream hover:bg-stone/20 transition-colors">
              <div className="flex items-center gap-3 p-4">
                {/* Product info — links to product page */}
                <Link
                  href={`/${locale}/products/${p.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  {p.attributes?.hex ? (
                    <div
                      className="w-10 h-10 flex-shrink-0 rounded-sm"
                      style={{ background: p.attributes.hex }}
                    />
                  ) : (
                    <div className="w-10 h-10 flex-shrink-0 rounded-sm bg-stone/30" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base truncate">{p.name}</div>
                    <div className="font-display italic text-xs text-soft-ink truncate">
                      {p.brand}
                      {p.shade_name && ` · ${p.shade_name}`}
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.28em] text-mute mt-0.5">
                      {p.category.replace(/_/g, " ")}
                    </div>
                  </div>
                </Link>

                {/* Add button */}
                <button
                  onClick={(e) => add(e, p.id)}
                  disabled={adding !== null || added.has(p.id)}
                  className={`flex-shrink-0 px-3 py-2 text-[10px] uppercase tracking-wider border transition-colors disabled:opacity-50 ${
                    added.has(p.id)
                      ? "border-stone/40 text-mute"
                      : "border-ink text-ink hover:bg-ink hover:text-bone"
                  }`}
                >
                  {adding === p.id ? "…" : added.has(p.id) ? "✓" : "+ Legg til"}
                </button>
              </div>
            </div>
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
