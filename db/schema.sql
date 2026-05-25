-- ============================================================
-- TONEUP — Database schema (PostgreSQL / Supabase)
-- ============================================================
-- Conventions:
--   - All tables have user_id (uuid) → auth.users(id) where relevant
--   - All tables have RLS enabled
--   - Timestamps: created_at, updated_at (UTC)
--   - Enums defined first, then tables, then policies
-- ============================================================

-- ---- EXTENSIONS ----
create extension if not exists "uuid-ossp";

-- ---- ENUMS ----
create type skin_type as enum ('dry', 'oily', 'combination', 'normal', 'sensitive', 'unknown');
create type gender_identity as enum ('female', 'male', 'non_binary', 'prefer_not_to_say', 'other');
create type product_category as enum (
  'cleanser', 'toner', 'serum', 'moisturizer', 'spf', 'mask', 'exfoliant', 'eye_cream',
  'foundation', 'concealer', 'blush', 'contour', 'bronzer', 'highlighter',
  'lipstick', 'lip_gloss', 'mascara', 'eyeliner', 'eyeshadow', 'brow', 'setting_powder',
  'other'
);
create type price_tier as enum ('budget', 'mid', 'premium', 'luxury');
create type product_status as enum ('using', 'tried', 'wishlist', 'archived');
create type life_phase as enum ('none', 'menstrual_cycle', 'pregnancy', 'breastfeeding', 'menopause', 'other');
create type season as enum ('spring', 'summer', 'autumn', 'winter');
create type locale_code as enum ('no', 'da', 'sv', 'es', 'fr', 'en');

-- ============================================================
-- USER PROFILES
-- ============================================================
create table user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age_range text,                       -- '18-24', '25-34', etc. (less invasive than exact age)
  gender gender_identity default 'prefer_not_to_say',
  skin_type skin_type default 'unknown',
  skin_goals text[] default '{}',       -- ['glow', 'less_dryness', 'even_tone', ...]
  help_with text[] default '{}',        -- ['skincare', 'foundation', 'blush', ...]
  preferences jsonb default '{}'::jsonb,-- {fragrance_free: true, vegan: true, budget: 'mid', ...}
  life_phase life_phase default 'none',
  life_phase_details jsonb default '{}'::jsonb, -- opt-in extra context, encrypted at app layer if sensitive
  locale locale_code default 'no',
  onboarding_completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- GLOBAL PRODUCT CATALOG
-- ============================================================
create table products (
  id uuid primary key default uuid_generate_v4(),
  brand text not null,
  name text not null,
  category product_category not null,
  shade_name text,
  shade_code text,
  price_tier price_tier,
  attributes jsonb default '{}'::jsonb, -- {vegan: true, fragrance_free: true, spf: 30, ...}
  image_url text,
  external_refs jsonb default '{}'::jsonb, -- {revieve_id: '...', sephora_sku: '...'}
  created_at timestamptz default now(),
  unique (brand, name, shade_code)
);
create index idx_products_category on products (category);
create index idx_products_brand on products (brand);

-- ============================================================
-- USER'S PRODUCT LOG (skincare focus)
-- ============================================================
create table user_products (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references products(id), -- nullable; user can log custom products
  custom_brand text,                       -- used when product_id is null
  custom_name text,
  category product_category not null,
  shade_name text,
  shade_code text,
  status product_status default 'using',
  rating smallint check (rating between 1 and 5),
  works_well boolean,                      -- explicit thumbs up/down
  notes text,
  used_in_seasons season[] default '{}',   -- tagged by user or inferred
  started_at date,
  ended_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_user_products_user on user_products (user_id);
create index idx_user_products_category on user_products (user_id, category);

-- ============================================================
-- MIN SMINKEPUNG (makeup-focused, separate for UX clarity)
-- ============================================================
create table makeup_bag_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid references products(id),
  custom_brand text,
  custom_name text,
  category product_category not null,
  shade_name text,
  shade_code text,
  status product_status default 'using',   -- using | wishlist | tried | archived
  loved boolean default false,
  notes text,
  occasions text[] default '{}',           -- ['daily', 'evening', 'summer', ...]
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_makeup_bag_user on makeup_bag_items (user_id);

-- ============================================================
-- WEEKLY / DAILY SKIN LOG
-- ============================================================
create table skin_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at date not null default current_date,
  dryness smallint check (dryness between 0 and 5),
  oiliness smallint check (oiliness between 0 and 5),
  redness smallint check (redness between 0 and 5),
  sensitivity smallint check (sensitivity between 0 and 5),
  breakouts smallint check (breakouts between 0 and 5),
  glow smallint check (glow between 0 and 5),
  foundation_sat_well boolean,            -- "hvordan foundation satt den dagen"
  reaction_to_product_id uuid references user_products(id) on delete set null,
  reaction_notes text,
  free_text text,
  created_at timestamptz default now(),
  unique (user_id, logged_at)             -- one entry per user per day
);
create index idx_skin_logs_user_date on skin_logs (user_id, logged_at desc);

-- ============================================================
-- SKIN ANALYSES (from Revieve or other engine)
-- ============================================================
create table skin_analyses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text,                         -- supabase storage path
  engine text not null,                    -- 'revieve' | 'mock' | 'openai'
  engine_version text,
  raw_result jsonb not null,               -- full payload from engine
  summary jsonb,                           -- normalized: {hydration: 0.6, redness: 0.3, ...}
  taken_at timestamptz default now(),
  created_at timestamptz default now()
);
create index idx_skin_analyses_user on skin_analyses (user_id, taken_at desc);

-- ============================================================
-- RECOMMENDATIONS (your own engine output, cached)
-- ============================================================
create table recommendations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  context text not null,                   -- 'daily_pick' | 'foundation_match' | 'seasonal' | ...
  payload jsonb not null,                  -- {products: [...], reasoning: '...', confidence: 0.8}
  shown_at timestamptz,
  dismissed_at timestamptz,
  acted_on boolean default false,
  expires_at timestamptz,
  created_at timestamptz default now()
);
create index idx_recommendations_user on recommendations (user_id, created_at desc);

-- ============================================================
-- SEASONAL PROFILES (derived from history)
-- ============================================================
create table seasonal_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  season season not null,
  year smallint not null,
  insights jsonb not null,                 -- {best_products: [...], dominant_concerns: [...], notes: '...'}
  computed_at timestamptz default now(),
  unique (user_id, season, year)
);
create index idx_seasonal_user on seasonal_profiles (user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table user_profiles enable row level security;
alter table user_products enable row level security;
alter table makeup_bag_items enable row level security;
alter table skin_logs enable row level security;
alter table skin_analyses enable row level security;
alter table recommendations enable row level security;
alter table seasonal_profiles enable row level security;
-- products is public-read; rest is private-per-user

-- Policy template: users can do everything with their own rows
create policy "own_profile" on user_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_products" on user_products
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_makeup_bag" on makeup_bag_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_skin_logs" on skin_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_analyses" on skin_analyses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_recommendations" on recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_seasonal" on seasonal_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Products: anyone authenticated can read; only service role writes
alter table products enable row level security;
create policy "products_read" on products for select using (auth.role() = 'authenticated');

-- ============================================================
-- TRIGGERS — updated_at maintenance
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_profiles_updated before update on user_profiles
  for each row execute function set_updated_at();
create trigger trg_user_products_updated before update on user_products
  for each row execute function set_updated_at();
create trigger trg_makeup_bag_updated before update on makeup_bag_items
  for each row execute function set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into user_profiles (user_id, locale)
  values (new.id, 'no');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
