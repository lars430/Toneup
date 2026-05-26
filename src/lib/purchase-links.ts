export interface RetailerLink {
  name: string;
  url: string;
  verified: boolean;
}

// Google Shopping parameters per locale — shows only real retailers that stock the product
const GOOGLE_SHOPPING: Record<string, { gl: string; hl: string }> = {
  no: { gl: "no", hl: "no" },
  da: { gl: "dk", hl: "da" },
  sv: { gl: "se", hl: "sv" },
  en: { gl: "us", hl: "en" },
  fr: { gl: "fr", hl: "fr" },
  es: { gl: "es", hl: "es" },
};

/**
 * Returns purchase links for a product.
 *
 * Priority:
 * 1. Verified product-specific URLs stored in the DB (purchase_urls column)
 * 2. Google Shopping fallback — country-localised, only shows real retailers
 */
export function getPurchaseLinks(
  locale: string,
  brand: string,
  name: string,
  shadeName: string | null | undefined,
  purchaseUrls: Record<string, string | string[]> | null | undefined
): RetailerLink[] {
  // 1. Verified URLs from DB for this locale, or global fallback
  const raw = purchaseUrls?.[locale] ?? purchaseUrls?.["global"];
  const verified = raw ? (Array.isArray(raw) ? raw : [raw]) : [];

  if (verified.length > 0) {
    return verified.map((url) => {
      let name = url;
      try {
        name = new URL(url).hostname.replace(/^www\./, "");
      } catch {}
      return { name, url, verified: true };
    });
  }

  // 2. Google Shopping fallback
  const gs = GOOGLE_SHOPPING[locale] ?? GOOGLE_SHOPPING.en;
  const query = encodeURIComponent(
    [brand, name, shadeName].filter(Boolean).join(" ")
  );
  return [
    {
      name: "Google Shopping",
      url: `https://www.google.com/search?q=${query}&tbm=shop&gl=${gs.gl}&hl=${gs.hl}`,
      verified: false,
    },
  ];
}
