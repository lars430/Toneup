export interface RetailerLink {
  name: string;
  url: string;
}

const RETAILERS: Record<string, Array<{ name: string; search: string }>> = {
  no: [
    { name: "Kicks",       search: "https://www.kicks.no/search/?q=" },
    { name: "Nordicfeel",  search: "https://www.nordicfeel.no/search/?q=" },
    { name: "Eleven",      search: "https://www.eleven.no/search?query=" },
  ],
  da: [
    { name: "Kicks",       search: "https://www.kicks.dk/search/?q=" },
    { name: "Matas",       search: "https://www.matas.dk/search?q=" },
    { name: "Nordicfeel",  search: "https://www.nordicfeel.dk/search/?q=" },
  ],
  sv: [
    { name: "Kicks",       search: "https://www.kicks.se/search/?q=" },
    { name: "Lyko",        search: "https://www.lyko.se/sv/search?q=" },
    { name: "Nordicfeel",  search: "https://www.nordicfeel.se/search/?q=" },
  ],
  en: [
    { name: "Sephora",      search: "https://www.sephora.com/search?keyword=" },
    { name: "LookFantastic", search: "https://www.lookfantastic.com/searchterm/" },
    { name: "Cult Beauty",  search: "https://www.cultbeauty.com/search?q=" },
  ],
  fr: [
    { name: "Sephora",  search: "https://www.sephora.fr/search?q=" },
    { name: "Nocibé",   search: "https://www.nocibe.fr/recherche?q=" },
    { name: "LookFantastic", search: "https://www.lookfantastic.fr/searchterm/" },
  ],
  es: [
    { name: "Sephora",  search: "https://www.sephora.es/search?q=" },
    { name: "Primor",   search: "https://www.primor.eu/catalogsearch/result/?q=" },
    { name: "LookFantastic", search: "https://www.lookfantastic.es/searchterm/" },
  ],
};

export function getPurchaseLinks(
  locale: string,
  brand: string,
  name: string,
  shadeName?: string | null
): RetailerLink[] {
  const retailers = RETAILERS[locale] ?? RETAILERS.en;
  const query = encodeURIComponent(
    [brand, name, shadeName].filter(Boolean).join(" ")
  );
  return retailers.map((r) => ({ name: r.name, url: r.search + query }));
}
