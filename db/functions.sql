-- ============================================================
-- TONEUP — Helper functions
-- ============================================================

-- Atomic increment for usage counters (avoids race conditions)
create or replace function increment_usage_counter(
  p_user_id uuid,
  p_day date,
  p_column text
) returns void as $$
begin
  if p_column = 'analyses_count' then
    insert into usage_counters (user_id, day, analyses_count)
    values (p_user_id, p_day, 1)
    on conflict (user_id, day)
    do update set analyses_count = usage_counters.analyses_count + 1;
  elsif p_column = 'ai_questions_count' then
    insert into usage_counters (user_id, day, ai_questions_count)
    values (p_user_id, p_day, 1)
    on conflict (user_id, day)
    do update set ai_questions_count = usage_counters.ai_questions_count + 1;
  end if;
end;
$$ language plpgsql security definer;

-- Allow users to call it for themselves
revoke all on function increment_usage_counter from public;
grant execute on function increment_usage_counter to authenticated;
