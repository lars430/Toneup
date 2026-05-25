# Toneup — Beauty & Skincare App

> En stille studie av hudens lys.

Toneup er en redaksjonell, luksusorientert hud- og sminkeapp. Branding-tilnærmingen er motehus, ikke tech-startup.

## Status

**MVP klar for testing**, ikke for offentlig lansering uten produktverifisering.

### Hva fungerer

- **Onboarding** (4 steg, ikke 8)
- **Første palette-rapport** — aha-øyeblikk umiddelbart etter onboarding
- **Hudanalyse** med hvitpapir-kalibrering (Ritual N° 01 — Lyset)
- **Daglig hudlogg** (1 hovedspørsmål + tags)
- **Sminkepung** med 647 produkter i katalogen
- **Anbefalingsmotor** med sesongbevissthet
- **Abonnement** via Stripe (Free / Pro 99 NOK/mnd / Pro Annual 990 NOK/år)
- **AI-rådgiver** via Claude API (Pro-funksjon)
- **Før/etter-galleri** (Pro-funksjon)
- **Delbare palette-kort** for Instagram (SVG generert server-side)
- **6 språk** (no/en fullt oversatt, da/sv/es/fr stubs)

### Hva mangler før offentlig lansering

- **Produktverifisering**: Alle 647 produkter har verified=false
- **Foundation-shade-database**: Brand-spesifikk matching krever lisensiert eller manuell database
- **Affiliate-lenker**: Vurder Sephora, Nordic-merker, Adam & Eve
- **Push-notifikasjoner**: Ikke implementert
- **Mobil-app**: Dette er en PWA; for App Store/Play Store vurder Capacitor-wrapper

## Arkitektur

Tre-lags separasjon:

1. UI-lag — Toneup-branded (Next.js 14 + Tailwind + next-intl)
2. Domene-lag — Toneups egen logikk (anbefaling, sesongprofil, palette)
3. Engine-lag — Pluggbar analyse-leverandør (mock | internal | revieve | openai)

Standard motor er `internal` — bruker hvitpapir-kalibrering, koster 0 NOK per analyse.

## Database

Kjør i Supabase SQL Editor i denne rekkefølgen:

1. db/schema.sql — Kjerneskjema
2. db/schema_pro.sql — Pro-funksjoner (abonnement, før/etter, delbare kort)
3. db/schema_updates.sql — Forenklet hudlogg
4. db/functions.sql — Helper-funksjoner
5. db/seed_products.sql — 647 produkter

Opprett deretter to storage buckets i Supabase:
- `skin-images` (privat)
- `shareable-cards` (offentlig lesetilgang)

## Miljøvariabler

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANALYSIS_PROVIDER=internal
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_ANNUAL=
```

## Lokalt på Windows

Se `toneup-windows-guide.md` for komplett guide. Kort:

```
npm install
cp .env.example .env.local  
# Fyll inn variabler
npm run dev
```

## Identifiserte svakheter og tiltak

| Svakhet | Status |
|---|---|
| Aha-øyeblikk kom for sent | Fikset: palette-rapport rett etter onboarding |
| Tom produktdatabase | Fikset: 647 produkter (verifisering gjenstår) |
| Onboarding for lang | Fikset: 8 til 4 steg |
| Hudlogg for klinisk | Fikset: 1 hovedspørsmål + tags |
| Ingen før/etter-historikk | Fikset: palette-snapshots + galleri |
| Ingen sosialt lag | Fikset: anonymiserte signaler |
| Ingen delbare øyeblikk | Fikset: SVG palette-kort |
| Ingen abonnement | Fikset: Stripe-integrasjon komplett |
| Foundation-matching ufullstendig | Krever brand-databaser |
| Emosjonell krok uke 1-3 | Delvis: dagens ritual hjelper, engasjement må måles |

## Pris-strategi

- **Gratis**: Onboarding + palette, 1 analyse/mnd, manuell logging, 50 produkter i pung
- **Pro 99 NOK/mnd**: Ubegrenset, AI-rådgiver, før/etter, sesongprofil, delbare kort
- **Pro Annual 990 NOK/år**: Tilsvarende månedlig × 10 (2 måneder gratis)
- **14 dagers gratis prøveperiode** på begge Pro-planer
