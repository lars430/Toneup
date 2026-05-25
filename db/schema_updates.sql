-- ============================================================
-- TONEUP — Schema updates for simplified skin log
-- ============================================================

-- Add new columns to skin_logs to support the simplified UI
alter table skin_logs
  add column if not exists feel_label text,
  add column if not exists tags text[];

-- Add helpful index for trend queries
create index if not exists idx_skin_logs_user_date
  on skin_logs (user_id, logged_at desc);
