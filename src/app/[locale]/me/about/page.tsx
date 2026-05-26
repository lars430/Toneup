import Link from "next/link";
import { brand } from "@/lib/brand";
import BottomNav from "@/components/BottomNav";

export default function AboutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <main className="min-h-dvh bg-bone pb-28">
      <div className="max-w-md mx-auto px-6 pt-10">

        <header className="flex items-center gap-4 mb-9">
          <Link href={`/${locale}/me`} className="text-[10px] uppercase tracking-[0.32em] text-soft-ink">←</Link>
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-1">Om oss</div>
            <h1 className="font-display text-3xl leading-tight tracking-wide2">{brand.name}</h1>
          </div>
        </header>

        <section className="mb-10">
          <p className="font-display italic text-soft-ink text-base leading-relaxed mb-6">
            {brand.name} er en personlig beauty-intelligens — ikke en butikk, ikke en influencer.
            Et stille verktøy som lærer huden din over tid.
          </p>
          <p className="font-display text-base leading-relaxed text-soft-ink mb-6">
            Vi tror at de beste resultatene kommer fra å kjenne seg selv: hudtonen sin, hva som
            fungerer i ulike sesonger, hvilke produkter som faktisk gjør en forskjell.
          </p>
          <p className="font-display text-base leading-relaxed text-soft-ink">
            Alle analyser gjøres på din enhet. Bildene lagres ikke — kun fargeavlesningen.
            Din historikk tilhører deg.
          </p>
        </section>

        <div className="divider-line mb-10" />

        <section className="mb-10 space-y-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-2">Analyse</div>
            <p className="font-display text-sm leading-relaxed text-soft-ink">
              Hudanalysen bruker hvitt papir som lysreferanse for å kompensere for ulik belysning.
              Vi måler hudtone, undertone, dybde og overflaterødhet. Vi lyver ikke om hva vi kan og
              ikke kan måle fra et enkelt bilde.
            </p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-2">AI-rådgiveren</div>
            <p className="font-display text-sm leading-relaxed text-soft-ink">
              Rådgiveren er bygget på Claude (Anthropic) og bruker din fulle historikk — hudtype,
              hudlogger, analyseresultater og produkter. Den gir kosmetisk veiledning, ikke
              medisinske diagnoser.
            </p>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-mute mb-2">Personvern</div>
            <p className="font-display text-sm leading-relaxed text-soft-ink">
              Data lagres i Supabase med full kryptering. Bilder behandles på enheten din og
              slettes etter analyse. Vi deler aldri data med tredjeparter for markedsføring.
            </p>
          </div>
        </section>

        <div className="text-center">
          <p className="text-[10px] tracking-wider text-mute leading-relaxed">
            {brand.name} · v{brand.version} · {brand.year}
          </p>
        </div>
      </div>

      <BottomNav locale={locale} />
    </main>
  );
}
