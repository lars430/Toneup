# Toneup — Arkitektur & MVP-plan

## 1. Prinsipper

Tre tydelige lag:

```
┌─────────────────────────────────────────┐
│  UI-LAG (Toneup-merket)                │  ← Din branding, din UX
│  Next.js App Router, Tailwind, i18n     │
├─────────────────────────────────────────┤
│  DOMENELAG (din egen logikk)            │  ← Det som gjør Toneup unik
│  Recommendations, Seasonal Profile,     │
│  History, Pattern Detection             │
├─────────────────────────────────────────┤
│  MOTOR-LAG (byttbare engines)           │  ← Revieve er én av flere
│  AnalysisProvider interface             │
│    ├── RevieveAdapter                   │
│    ├── MockAdapter (for utvikling)      │
│    └── OpenAIAdapter (fase 2)           │
└─────────────────────────────────────────┘
```

Revieve berører kun motor-laget. Resten av appen vet ikke at den finnes.

## 2. Tech stack

| Lag           | Valg                                 | Hvorfor                                     |
| ------------- | ------------------------------------ | ------------------------------------------- |
| Frontend      | Next.js 14 (App Router) + TypeScript | Server Components, god i18n, deployment    |
| Styling       | Tailwind CSS + CSS-variabler         | Holder Toneup-tokens konsistente           |
| Fonts         | Cormorant Garamond + Inter Tight     | Editorial display + presis brødtekst        |
| Database/Auth | Supabase (Postgres + RLS + Storage)  | Auth, DB, bildelagring på én plattform      |
| i18n          | next-intl                            | App Router-støtte, message-bundles per lang |
| Hosting       | Vercel                               | Null-config for Next.js                     |
| Motor (MVP)   | MockAdapter → RevieveAdapter         | Bygg uten å vente på API-nøkler             |

Mobil-først webapp først. React Native vurderes i fase 3 når produktet er validert.

## 3. Datamodell (kjerne-tabeller)

| Tabell              | Formål                                                     |
| ------------------- | ---------------------------------------------------------- |
| `users`             | Supabase auth (gitt)                                       |
| `user_profiles`     | Alder, kjønn, hudtype, mål, preferanser, livsfase-flagg    |
| `products`          | Global katalog (kan seedes + utvides etter behov)          |
| `user_products`     | Brukerens egen logg: rating, notater, sesong-tag           |
| `makeup_bag_items`  | "Min sminkepung" — shade/farge/ønskeliste                  |
| `skin_logs`         | Daglig/ukentlig observasjon                                |
| `skin_analyses`     | Resultat fra engine (JSON), lagret med bilde-ref           |
| `recommendations`   | Cachet output fra din rådgivningsmotor                     |
| `seasonal_profiles` | Avledet fra historikk; oppdateres periodisk                |
| `locale_prefs`      | Brukerens språkvalg                                        |

Detaljer i `db/schema.sql`.

## 4. Engine-abstraksjon

Alt som har med "beauty AI" å gjøre går gjennom én interface:

```ts
interface AnalysisProvider {
  analyzeSkin(image: Buffer, userContext: UserContext): Promise<SkinAnalysisResult>;
  matchFoundation(image: Buffer, preferences: Prefs): Promise<ShadeMatch[]>;
  recommendProducts(profile: UserProfile, category: Category): Promise<ProductSuggestion[]>;
}
```

Tre konkrete implementasjoner:
- **`MockAdapter`** — bruker mens du venter på Revieve. Returnerer realistiske dummy-data.
- **`RevieveAdapter`** — wrapper Revieve SDK når du har tilgang.
- **`OpenAIAdapter`** (fase 2) — for åpne spørsmål: "Passer dette serumet til huden min?"

Du bytter ved å endre én env-variabel: `ANALYSIS_PROVIDER=mock|revieve|openai`.

## 5. MVP-prioritering (4–6 uker)

### Uke 1–2: Fundament
- [x] Prosjektoppsett (Next.js, Tailwind, Supabase, i18n)
- [x] Database-skjema + RLS-policies
- [x] Auth-flow (epost + magic link)
- [x] Språkvelger (6 språk klare som tomme bundles, norsk + engelsk fylt)
- [x] Onboarding (5–6 steg)

### Uke 2–3: Logging
- [ ] Produktlogg (legg til / vurder / notater)
- [ ] Min sminkepung
- [ ] Ukentlig hudlogg

### Uke 3–4: Analyse + anbefalinger
- [ ] Bildeopplasting (Supabase Storage)
- [ ] MockAdapter for hudanalyse → lagre resultat
- [ ] Enkel regelbasert rådgivningsmotor (din egen logikk)
- [ ] "Dagens utvalg" på hjem-skjerm basert på profil + sesong

### Uke 4–5: Sesongprofil + refining
- [ ] Sesongprofil-beregning (cron / on-demand)
- [ ] "Dette fungerer best for deg i kald periode"-innsikter
- [ ] Polish: animasjoner, tomme tilstander, feilhåndtering

### Uke 5–6: Revieve + testing
- [ ] Bytt MockAdapter → RevieveAdapter (når API-tilgang er klar)
- [ ] Interne brukertester med 5–10 brukere
- [ ] Bugs, copy, polish

### Fase 2 (senere)
- Forum / community
- OpenAIAdapter for åpne spørsmål
- Affiliate / produktkjøp
- Abonnement / premium
- React Native-pakking

## 6. Hva som er DIN logikk vs Revieve

| Funksjon                     | Hvem eier det                                |
| ---------------------------- | -------------------------------------------- |
| Onboarding-flow              | Toneup                                      |
| Brukerprofil + historikk     | Toneup                                      |
| Produktlogg                  | Toneup                                      |
| Min sminkepung               | Toneup                                      |
| Hudlogg + mønsterdeteksjon   | Toneup                                      |
| **Hudanalyse fra bilde**     | Revieve (motor) → resultat lagres i Toneup  |
| **Foundation-matching**      | Revieve (motor) → forslag rangeres av Toneup|
| Sesongprofil                 | Toneup                                      |
| Rådgivningsmotor (regler)    | Toneup                                      |
| Åpne produktspørsmål (fase 2)| OpenAI (motor) → Toneup prompt + kontekst   |

## 7. Sikkerhet & personvern

- Row Level Security i Supabase: brukere ser kun egne data
- Bilder lagres i privat bucket, signerte URL-er ved behov
- Helsedata (livsfase, hormonelle faktorer) er opt-in og ekstra beskyttet
- GDPR: eksport + sletting av all brukerdata via "Mine data"-skjerm
- Tydelig disclaimer: kosmetiske anbefalinger, ikke medisinske diagnoser
