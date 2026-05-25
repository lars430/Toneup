import { redirect } from "next/navigation";
import Link from "next/link";
import { createServer } from "@/lib/supabase";

export default async function BagPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const supabase = createServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/sign-in`);

  // Get user's bag items with product details
  const { data: items } = await supabase
    .from("makeup_bag_items")
    .select("*, products(*)")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  // Group by category
  const byCategory: Record<string, any[]> = {};
  (items ?? []).forEach((item: any) => {
    const cat = item.products?.category || "other";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  });

  return (
    <main className="min-h-screen bg-bone pb-32">
      <div className="max-w-md mx-auto px-7 py-10">
        <div className="text-center mb-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-3">
            Sminkepung
          </div>
          <h1 className="font-display text-4xl tracking-wide2 mb-2">
            Dine produkter
          </h1>
          <p className="font-display italic text-soft-ink text-base mt-3">
            Et arkiv over hva du eier.
          </p>
        </div>

        {!items || items.length === 0 ? (
          <div className="text-center py-12">
            <div className="divider-line mx-auto mb-7" />
            <p className="font-display italic text-soft-ink text-base mb-7 leading-relaxed">
              Sminkepungen er ennå tom.<br />
              Legg til ditt første produkt for å begynne arkivet.
            </p>
            <Link href={`/${locale}/bag/add`} className="btn-primary inline-block w-auto px-8">
              Legg til produkt
            </Link>
          </div>
        ) : (
          <>
            {Object.entries(byCategory).map(([cat, list]) => (
              <section key={cat} className="mb-8">
                <div className="editorial-eyebrow mb-3">{translateCategory(cat)}</div>
                <div className="space-y-2">
                  {list.map((item: any) => (
                    <Link key={item.id} href={`/${locale}/bag/${item.id}`}
                      className="block bg-cream p-4">
                      <div className="flex items-start gap-4">
                        {item.products?.attributes?.hex && (
                          <div className="w-12 h-12 flex-shrink-0"
                            style={{ background: item.products.attributes.hex }} />
                        )}
                        <div className="flex-1">
                          <div className="font-display text-base">{item.products?.name}</div>
                          <div className="font-display italic text-xs text-soft-ink">
                            {item.products?.brand}
                            {item.products?.shade_name && ` · ${item.products.shade_name}`}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}

            <Link href={`/${locale}/bag/add`}
              className="block text-center py-4 border border-ink text-[11px] uppercase tracking-[0.32em] mt-8">
              + Legg til produkt
            </Link>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-bone border-t border-stone/30">
        <div className="max-w-md mx-auto flex">
          {[
            { href: `/${locale}/home`, label: "Hjem" },
            { href: `/${locale}/skin-log`, label: "Logg" },
            { href: `/${locale}/bag`, label: "Pung", active: true },
            { href: `/${locale}/me`, label: "Meg" },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex-1 py-5 text-center text-[10px] uppercase tracking-[0.32em] ${
                item.active ? "text-ink font-medium" : "text-soft-ink"
              }`}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}

function translateCategory(cat: string): string {
  const map: Record<string, string> = {
    cleanser: "Rens",
    toner: "Toner",
    serum: "Serum",
    moisturizer: "Fuktighet",
    eye_cream: "Øyekrem",
    spf: "Solbeskyttelse",
    mask: "Maske",
    exfoliant: "Eksfoliering",
    foundation: "Foundation",
    concealer: "Concealer",
    setting_powder: "Pudder",
    blush: "Rouge",
    highlighter: "Highlighter",
    eyeshadow: "Øyeskygge",
    eyeliner: "Eyeliner",
    mascara: "Maskara",
    lipstick: "Leppestift",
    lip_gloss: "Leppeglans",
    brow: "Bryn",
    other: "Annet",
  };
  return map[cat] || cat;
}
