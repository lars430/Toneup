import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import { getPurchaseLinks } from "@/lib/purchase-links";
import AddToBagButton from "./_components/AddToBagButton";

const CATEGORY_LABELS: Record<string, string> = {
  cleanser: "Rens", toner: "Toner", serum: "Serum",
  moisturizer: "Fuktighet", eye_cream: "Øyekrem", sunscreen: "Solbeskyttelse",
  spf: "SPF", mask: "Maske", exfoliant: "Eksfoliering", oil: "Olje",
  lip_care: "Leppepleie", lip_plumper: "Leppeplumper",
  body_lotion: "Bodylotion", body_cream: "Bodykrem", body_butter: "Bodysmør",
  body_oil: "Kroppsolje", body_wash: "Dusjsåpe", body_scrub: "Bodyscrub",
  hand_cream: "Håndkrem", deodorant: "Deodorant", self_tanner: "Selvbruner",
  shampoo: "Sjampo", conditioner: "Balsam", hair_mask: "Hårmaske",
  hair_oil: "Hårolje", hair_treatment: "Hårbehandling", dry_shampoo: "Tørrsjampo",
  foundation: "Foundation", concealer: "Concealer", setting_powder: "Pudder",
  blush: "Rouge", highlighter: "Highlighter", bronzer: "Bronzer",
  eyeshadow: "Øyeskygge", eyeshadow_palette: "Øyeskyggepalett",
  eyeliner: "Eyeliner", mascara: "Maskara", lipstick: "Leppestift",
  lip_gloss: "Leppeglans", brow: "Bryn", primer: "Primer",
  nail_polish: "Neglelakk", nail_gel: "Gellakk", nail_treatment: "Neglebehandling",
  fragrance: "Parfyme", supplement: "Supplement", shaving: "Barbering",
  other: "Annet",
};

const PRICE_TIER_LABELS: Record<string, string> = {
  budget: "Budsjett", mid: "Mellomklasse", premium: "Premium", luxury: "Luksus",
};

export default async function ProductPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const [{ data: product }, { data: profile }, { data: bagItem }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("user_profiles")
      .select("locale")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("makeup_bag_items")
      .select("id, loved, status")
      .eq("user_id", user.id)
      .eq("product_id", id)
      .maybeSingle(),
  ]);

  if (!product) notFound();

  const userLocale = profile?.locale ?? locale;
  const purchaseLinks = getPurchaseLinks(
    userLocale,
    product.brand,
    product.name,
    product.shade_name,
    product.purchase_urls ?? null
  );

  const attr = product.attributes ?? {};
  const categoryLabel = CATEGORY_LABELS[product.category] ?? product.category;
  const priceTierLabel = PRICE_TIER_LABELS[product.price_tier] ?? product.price_tier;

  return (
    <main className="min-h-screen bg-bone pb-24">
      <div className="max-w-md mx-auto px-6 pt-10">

        {/* Back */}
        <Link
          href={`/${locale}/bag`}
          className="text-[10px] uppercase tracking-[0.32em] text-soft-ink mb-8 inline-block"
        >
          ← Tilbake
        </Link>

        {/* Color swatch */}
        {attr.hex && (
          <div
            className="w-full h-32 mb-7"
            style={{ background: attr.hex }}
          />
        )}
        {!attr.hex && (
          <div className="w-full h-32 mb-7 bg-stone/30" />
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-2">
            {categoryLabel}
          </div>
          <h1 className="font-display text-4xl tracking-wide2 mb-1">
            {product.name}
          </h1>
          <p className="font-display italic text-soft-ink text-base">
            {product.brand}
            {product.shade_name && ` · ${product.shade_name}`}
          </p>
        </div>

        {/* Attributes */}
        <div className="bg-cream px-5 py-5 mb-6 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-3">
            Produktdetaljer
          </div>

          <Row label="Priskategori" value={priceTierLabel} />
          {attr.finish && <Row label="Finish" value={attr.finish} />}
          {attr.undertone && <Row label="Undertone" value={attr.undertone} />}
          {attr.coverage && <Row label="Dekning" value={attr.coverage} />}
          {attr.spf && <Row label="SPF" value={String(attr.spf)} />}
          {product.origin_country && (
            <Row label="Opprinnelse" value={product.origin_country} />
          )}

          {/* Badges */}
          {(attr.vegan || attr.fragrance_free || attr.cruelty_free) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {attr.vegan && <Badge label="Vegansk" />}
              {attr.cruelty_free && <Badge label="Cruelty-free" />}
              {attr.fragrance_free && <Badge label="Parfymefritt" />}
            </div>
          )}
        </div>

        {/* Add to bag */}
        <div className="mb-8">
          <AddToBagButton
            productId={product.id}
            locale={locale}
            alreadyInBag={bagItem !== null}
            bagItemId={bagItem?.id ?? null}
          />
        </div>

        {/* Purchase links */}
        <div className="mb-8">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-4">
            Kjøp produktet
          </div>
          <div className="space-y-2">
            {purchaseLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-cream px-5 py-4 hover:bg-stone/30 transition-colors"
              >
                <span className="font-display text-sm">{link.name}</span>
                <span className="text-[10px] uppercase tracking-[0.28em] text-soft-ink">
                  {link.verified ? "Se produkt →" : "Søk →"}
                </span>
              </a>
            ))}
          </div>
          {purchaseLinks.some((l) => !l.verified) && (
            <p className="text-[10px] text-mute mt-3 leading-relaxed">
              Google Shopping filtrerer til forhandlere som faktisk selger produktet.
            </p>
          )}
        </div>

      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="font-display text-xs text-mute">{label}</span>
      <span className="font-display text-sm capitalize">{value}</span>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="px-3 py-1 border border-stone/50 text-[9px] uppercase tracking-[0.28em] text-soft-ink">
      {label}
    </span>
  );
}
