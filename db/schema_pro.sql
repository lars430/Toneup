-- ============================================================
-- TONEUP — Schema additions for Pro features
-- Adds: subscriptions, social signals, before/after gallery,
-- shareable palette cards, AI question history
-- ============================================================

-- ---- SUBSCRIPTIONS ----
create type subscription_status as enum (
  'trialing', 'active', 'past_due', 'canceled', 'incomplete', 'paused'
);

create type subscription_tier as enum ('free', 'pro', 'pro_annual');

create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  tier subscription_tier default 'free',
  status subscription_status default 'active',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create unique index idx_subscriptions_user on subscriptions (user_id);

alter table subscriptions enable row level security;
create policy "own_subscription_read" on subscriptions
  for select using (auth.uid() = user_id);
-- Only service role writes (via Stripe webhook)

-- Helper view: easy access to current tier
create or replace view user_tier as
  select
    u.id as user_id,
    coalesce(s.tier, 'free') as tier,
    coalesce(s.status, 'active') as status,
    s.current_period_end,
    s.trial_ends_at
  from auth.users u
  left join subscriptions s on s.user_id = u.id;

-- ---- BEFORE / AFTER GALLERY ----
-- Curated visual history user creates from their analyses
create table palette_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid references skin_analyses(id) on delete set null,
  taken_at timestamptz default now(),
  -- Cached display data (so deleting the analysis doesn't break the gallery)
  hex_color text,
  undertone text,
  depth text,
  shade_label text,
  season text,
  user_notes text,
  is_pinned boolean default false,
  created_at timestamptz default now()
);
create index idx_snapshots_user_date on palette_snapshots (user_id, taken_at desc);
alter table palette_snapshots enable row level security;
create policy "own_snapshots" on palette_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- SHAREABLE CARDS ----
-- When user generates an Instagram-shareable palette card, we cache it.
create table shareable_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_id uuid references palette_snapshots(id) on delete cascade,
  card_type text not null,                  -- 'palette' | 'season_recap' | 'product_review'
  image_path text,                          -- supabase storage path
  share_token text unique,                  -- public token for sharing without auth
  view_count integer default 0,
  created_at timestamptz default now(),
  expires_at timestamptz
);
create index idx_cards_user on shareable_cards (user_id);
create index idx_cards_token on shareable_cards (share_token);
alter table shareable_cards enable row level security;
create policy "own_cards" on shareable_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Public read by share_token only (handled in app via service role)

-- ---- AI QUESTIONS LOG ----
-- Track usage for rate-limiting + product improvement
create table ai_questions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text,
  context_used jsonb,                       -- which data points were sent to LLM
  tokens_used integer,
  cost_usd numeric(10, 6),
  rated_helpful boolean,
  created_at timestamptz default now()
);
create index idx_ai_questions_user on ai_questions (user_id, created_at desc);
alter table ai_questions enable row level security;
create policy "own_questions" on ai_questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- ANONYMIZED SOCIAL SIGNALS ----
-- "Others with your palette loved this" feature, fully anonymized.
-- This view aggregates product loves by undertone/depth bucket.
create or replace view product_signals as
  select
    up.product_id,
    p.brand,
    p.name,
    p.category,
    p.shade_code,
    -- Bucket users by their last analysis
    coalesce((sa.raw_result -> 'raw' ->> 'undertone'), 'unknown') as bucket_undertone,
    coalesce((sa.raw_result -> 'raw' ->> 'depth'), 'unknown') as bucket_depth,
    count(*) filter (where up.works_well = true) as loves,
    count(*) filter (where up.works_well = false) as misses,
    avg(up.rating) as avg_rating
  from user_products up
  join products p on p.id = up.product_id
  left join lateral (
    select raw_result
    from skin_analyses
    where user_id = up.user_id
    order by taken_at desc
    limit 1
  ) sa on true
  where up.product_id is not null
  group by up.product_id, p.brand, p.name, p.category, p.shade_code,
           bucket_undertone, bucket_depth
  having count(*) >= 3;  -- min 3 users for privacy

-- ---- ONBOARDING SHORTCUTS ----
-- Track which "first wow report" version user saw, for A/B testing later
alter table user_profiles
  add column if not exists onboarding_variant text default 'v1',
  add column if not exists first_palette_shown_at timestamptz;

-- ---- USAGE COUNTERS ----
-- Daily counters for free-tier rate limiting (analyses, AI questions)
create table usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  analyses_count integer default 0,
  ai_questions_count integer default 0,
  primary key (user_id, day)
);
alter table usage_counters enable row level security;
create policy "own_usage" on usage_counters
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
