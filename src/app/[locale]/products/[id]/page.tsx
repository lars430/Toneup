import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";
import { getPurchaseLinks } from "@/lib/purchase-links";
import { deriveSkincareInfo, routineSlotLabel, routineStepLabel } from "@/lib/skincare-info";
import { buildSignal, scoreBagItem } from "@/lib/fit-now";
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

const SKINCARE_CATEGORIES = new Set([
  "cleanser", "toner", "serum", "moisturizer", "eye_cream",
  "spf", "sunscreen", "mask", "exfoliant", "oil",
]);

export default async function ProductPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  const [
    { data: product },
    { data: profile },
    { data: bagItem },
    { data: lastAnalysis },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase
      .from("user_profiles")
      .select("locale, skin_type, life_phase, preferences")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("makeup_bag_items")
      .select("id, loved, status")
      .eq("user_id", user.id)
      .eq("product_id", id)
      .maybeSingle(),
    supabase
      .from("skin_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("taken_at", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("skin_logs")
      .select("dryness, redness, glow, sensitivity, logged_at")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(7),
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

  const isSkincare = SKINCARE_CATEGORIES.has(product.category);
  const skincareInfo = isSkincare ? deriveSkincareInfo(product) : null;

  // Personal fit — works for any category but most informative for skincare/foundation
  const season = computeSeason();
  const sig = buildSignal(lastAnalysis, recentLogs ?? [], profile, season);
  const fit = scoreBagItem(
    { id: product.id, category: product.category, products: product, shade_name: product.shade_name, shade_code: product.shade_code },
    sig
  );

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

        {/* Swatch / hero */}
        {attr.hex ? (
          <div className="w-full h-32 mb-7" style={{ background: attr.hex }} />
        ) : (
          <div className="w-full h-32 mb-7 bg-stone/30" />
        )}

        {/* Header */}
        <div className="mb-7">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-2">
            {categoryLabel}
            {skincareInfo && (
              <span className="ml-2 text-mute">
                · {routineStepLabel(skincareInfo.routineStep).split("—")[0].trim()}
              </span>
            )}
          </div>
          <h1 className="font-display text-4xl tracking-wide2 mb-1 leading-tight">
            {product.name}
          </h1>
          <p className="font-display italic text-soft-ink text-base">
            {product.brand}
            {product.shade_name && ` · ${product.shade_name}`}
          </p>
        </div>

        {/* Personal fit — only when there's something to say */}
        {fit.reason && (
          <section
            className={`mb-6 px-5 py-4 ${
              fit.verdict === "great" || fit.verdict === "good"
                ? "bg-ink text-bone"
                : fit.verdict === "watch"
                ? "border border-accent/40"
                : "border border-stone/40"
            }`}
          >
            <div
              className={`text-[10px] uppercase tracking-[0.32em] mb-2 ${
                fit.verdict === "great" || fit.verdict === "good"
                  ? "text-bone/60"
                  : "text-mute"
              }`}
            >
              Passer huden din nå
            </div>
            <div
              className={`font-display text-base leading-snug ${
                fit.verdict === "great" || fit.verdict === "good"
                  ? "text-bone"
                  : fit.verdict === "watch"
                  ? "text-accent"
                  : "text-soft-ink"
              }`}
            >
              {fit.verdict === "watch" ? "Vær oppmerksom: " : ""}
              {fit.reason}
            </div>
          </section>
        )}

        {/* Skincare info block */}
        {skincareInfo && (
          <>
            {/* Key ingredient + routine slot */}
            <section className="mb-6 grid grid-cols-2 gap-3">
              {skincareInfo.keyIngredient && (
                <div className="bg-cream px-4 py-4">
                  <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-1">
                    Nøkkelingrediens
                  </div>
                  <div className="font-display text-base leading-snug">
                    {skincareInfo.keyIngredient}
                  </div>
                </div>
              )}
              <div className="bg-cream px-4 py-4">
                <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-1">
                  Når
                </div>
                <div className="font-display text-base leading-snug">
                  {routineSlotLabel(skincareInfo.routineSlot)}
                </div>
              </div>
            </section>

            {/* Passer for */}
            {skincareInfo.suitsFor.length > 0 && (
              <section className="mb-4 border border-stone/40 px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-3">
                  Passer for
                </div>
                <ul className="space-y-1">
                  {skincareInfo.suitsFor.map((s) => (
                    <li
                      key={s}
                      className="font-display text-sm text-soft-ink leading-relaxed"
                    >
                      · {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Unngå hvis */}
            {skincareInfo.avoidIf.length > 0 && (
              <section className="mb-4 border-l-2 border-accent/40 pl-5 py-1">
                <div className="text-[10px] uppercase tracking-[0.32em] text-accent mb-2">
                  Unngå hvis
                </div>
                <ul className="space-y-1">
                  {skincareInfo.avoidIf.map((s) => (
                    <li
                      key={s}
                      className="font-display text-sm text-soft-ink leading-relaxed"
                    >
                      · {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Adresserer */}
            {skincareInfo.addressesConcerns.length > 0 && (
              <section className="mb-4 bg-cream px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-2">
                  Adresserer
                </div>
                <div className="font-display text-sm text-soft-ink leading-relaxed">
                  {skincareInfo.addressesConcerns.join(" · ")}
                </div>
              </section>
            )}

            {/* How to use */}
            {skincareInfo.howToUse && (
              <section className="mb-6 border border-stone/40 px-5 py-4">
                <div className="text-[10px] uppercase tracking-[0.32em] text-mute mb-2">
                  Slik bruker du det
                </div>
                <p className="font-display italic text-sm text-soft-ink leading-relaxed">
                  {skincareInfo.howToUse}
                </p>
              </section>
            )}
          </>
        )}

        {/* Generic attributes (shown for everything) */}
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

          {(attr.vegan || attr.fragrance_free || attr.cruelty_free || attr.natural) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {attr.vegan && <Badge label="Vegansk" />}
              {attr.cruelty_free && <Badge label="Cruelty-free" />}
              {attr.fragrance_free && <Badge label="Parfymefritt" />}
              {attr.natural && <Badge label="Naturlig" />}
              {skincareInfo?.pregnancySafe === true && (
                <Badge label="Trygt i graviditet" />
              )}
            </div>
          )}
        </div>

        {/* Add to bag */}
        <div className="mb-6">
          <AddToBagButton
            productId={product.id}
            locale={locale}
            alreadyInBag={bagItem !== null}
            bagItemId={bagItem?.id ?? null}
          />
        </div>

        {/* Routine Match CTA — only for skincare */}
        {isSkincare && (
          <Link
            href={`/${locale}/routine-match?step=${product.category}`}
            className="block bg-cream px-5 py-4 mb-6 hover:bg-stone/30 transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.4em] text-accent mb-1">
                  Rutine Match
                </div>
                <div className="font-display text-base">
                  Se andre {categoryLabel.toLowerCase()} som passer deg
                </div>
              </div>
              <span className="text-mute text-base">→</span>
            </div>
          </Link>
        )}

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

function computeSeason(): "spring" | "summer" | "autumn" | "winter" {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "autumn";
  return "winter";
}
