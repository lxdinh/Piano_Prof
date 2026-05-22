-- ============================================================
-- Piano Professor — Initial Database Schema
-- Target: Supabase (PostgreSQL 15+)
-- ============================================================
-- Run order matters: enums → tables → indexes → functions →
-- triggers → views → RLS policies.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";        -- fuzzy song search

-- ── Shared timestamp trigger ──────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Enum types ────────────────────────────────────────────────

create type public.subscription_tier   as enum ('free', 'plus', 'max', 'family');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'paused');
create type public.lesson_type         as enum ('exercise', 'theory', 'song', 'ear_training', 'rhythm');
create type public.exercise_type       as enum (
  'play_note', 'play_chord', 'play_melody', 'play_rhythm',
  'identify_note', 'identify_chord', 'theory_question', 'ear_training'
);
create type public.lesson_status       as enum ('locked', 'available', 'in_progress', 'completed');
create type public.omr_status          as enum ('pending', 'processing', 'complete', 'failed');
create type public.input_method        as enum ('midi', 'microphone', 'screen_tap');
create type public.device_platform     as enum ('ios', 'android', 'web');
create type public.achievement_category as enum ('streak', 'accuracy', 'completion', 'social', 'milestone', 'hardware');
create type public.quest_type          as enum ('daily', 'weekly');
create type public.reward_type         as enum ('xp', 'gems', 'hearts', 'streak_freeze');
create type public.league_tier         as enum ('bronze', 'silver', 'gold', 'diamond', 'obsidian');
create type public.xp_source           as enum (
  'lesson_complete', 'perfect_lesson', 'streak_bonus', 'quest_complete',
  'achievement', 'song_complete', 'daily_bonus', 'refund'
);
create type public.sheet_file_type     as enum ('pdf', 'image', 'musicxml');

-- ============================================================
-- SECTION 1: USER IDENTITY & BILLING
-- ============================================================

-- Profiles (extends Supabase auth.users 1-to-1)
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  username          text unique not null
                      constraint username_length check (char_length(username) between 3 and 30)
                      constraint username_chars  check (username ~ '^[a-zA-Z0-9_.-]+$'),
  display_name      text not null default '',
  bio               text default '',
  avatar_url        text,
  country_code      char(2),                 -- ISO 3166-1 alpha-2
  timezone          text default 'UTC',
  preferred_input   input_method default 'midi',
  onboarding_done   boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.profiles is 'Public user profile data. Extends auth.users.';

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Subscriptions (one active row per user)
create table public.subscriptions (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references public.profiles(id) on delete cascade,
  tier                      subscription_tier   not null default 'free',
  status                    subscription_status not null default 'active',
  -- Stripe references (nullable for free tier)
  stripe_customer_id        text unique,
  stripe_subscription_id    text unique,
  -- Billing period
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  cancel_at_period_end      boolean not null default false,
  -- Regional pricing
  currency_code             char(3) default 'USD',
  price_cents               int,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);
create unique index subscriptions_user_active_idx
  on public.subscriptions(user_id)
  where status in ('trialing', 'active', 'past_due');

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ============================================================
-- SECTION 2: GAMIFICATION ENGINE
-- ============================================================

-- Streaks (one row per user, upserted on each lesson completion)
create table public.streaks (
  user_id             uuid primary key references public.profiles(id) on delete cascade,
  current_streak      int  not null default 0 check (current_streak >= 0),
  longest_streak      int  not null default 0 check (longest_streak >= 0),
  last_activity_date  date,                 -- null = never played
  freeze_count        smallint not null default 0 check (freeze_count >= 0),
  updated_at          timestamptz not null default now()
);

-- XP ledger (append-only)
create table public.xp_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  amount        int  not null,              -- negative for reversals
  source        xp_source not null,
  reference_id  uuid,                      -- session_id, achievement_id, etc.
  created_at    timestamptz not null default now()
);
create index xp_log_user_idx  on public.xp_log(user_id, created_at desc);
create index xp_log_week_idx  on public.xp_log(user_id, date_trunc('week', created_at));

-- Hearts (Duolingo life system — refill over time, max 5)
create table public.hearts (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  count         smallint not null default 5
                  constraint hearts_range check (count between 0 and 5),
  last_refill_at timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Gems (in-app currency for power-ups, streak freezes, heart refills)
create table public.gems (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  balance       int not null default 0 check (balance >= 0),
  updated_at    timestamptz not null default now()
);

-- Leaderboard snapshots (weekly)
create table public.leaderboard_snapshots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  week_start    date not null,
  xp_earned     int  not null default 0,
  rank          int,
  league        league_tier not null default 'bronze',
  created_at    timestamptz not null default now(),
  unique(user_id, week_start)
);
create index leaderboard_week_idx on public.leaderboard_snapshots(week_start, xp_earned desc);

-- ============================================================
-- SECTION 3: CURRICULUM
-- ============================================================

-- Courses (top-level curriculum containers)
create table public.courses (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  description     text not null default '',
  thumbnail_url   text,
  is_premium      boolean not null default false,
  position        smallint not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Sections (groups of lessons; appear as "chapters" on the lesson path)
create table public.sections (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null references public.courses(id) on delete cascade,
  title           text not null,
  color           text not null default '#58CC02',     -- hex brand color
  mascot_mood     text not null default 'teach',       -- mood key for section icon
  position        smallint not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index sections_course_pos_idx on public.sections(course_id, position);

-- Lessons
create table public.lessons (
  id                      uuid primary key default gen_random_uuid(),
  section_id              uuid not null references public.sections(id) on delete cascade,
  title                   text not null,
  description             text not null default '',
  lesson_type             lesson_type not null default 'exercise',
  difficulty              smallint not null default 1 check (difficulty between 1 and 5),
  position                smallint not null default 0,
  xp_reward               int  not null default 10,
  time_estimate_seconds   int  not null default 300,
  -- Optional associated MusicXML (for song/exercise lessons)
  musicxml_url            text,
  -- Piano keyboard context for LED highlighting
  focus_octave            smallint default 4,
  focus_notes             text[] default '{}',        -- e.g. '{C, E, G}'
  bpm                     smallint,
  time_signature          text default '4/4',
  is_premium              boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index lessons_section_pos_idx on public.lessons(section_id, position);

-- Exercises (individual steps within a lesson)
create table public.exercises (
  id              uuid primary key default gen_random_uuid(),
  lesson_id       uuid not null references public.lessons(id) on delete cascade,
  position        smallint not null default 0,
  exercise_type   exercise_type not null,
  instructions    text not null default '',
  -- Flexible payload: notes to play, multiple-choice options, chord diagram, etc.
  payload         jsonb not null default '{}',
  -- LED lighting context for this step
  led_notes       jsonb,   -- [{"midi":60,"r":88,"g":204,"b":2}, ...]
  bpm             smallint,
  beats_required  smallint default 4,
  created_at      timestamptz not null default now()
);
create index exercises_lesson_pos_idx on public.exercises(lesson_id, position);

-- ============================================================
-- SECTION 4: USER PROGRESS
-- ============================================================

-- Lesson progress (one row per user × lesson)
create table public.lesson_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  lesson_id       uuid not null references public.lessons(id) on delete cascade,
  status          lesson_status not null default 'locked',
  stars           smallint not null default 0 check (stars between 0 and 3),
  best_accuracy   numeric(5,4) check (best_accuracy between 0 and 1),
  play_count      int not null default 0,
  last_played_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, lesson_id)
);
create index lesson_progress_user_idx    on public.lesson_progress(user_id);
create index lesson_progress_status_idx on public.lesson_progress(user_id, status);

create trigger lesson_progress_updated_at
  before update on public.lesson_progress
  for each row execute function public.set_updated_at();

-- Lesson sessions (individual play-through records — immutable audit log)
create table public.lesson_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  lesson_id       uuid not null references public.lessons(id) on delete cascade,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  duration_seconds int generated always as (
    extract(epoch from (completed_at - started_at))::int
  ) stored,
  accuracy        numeric(5,4) check (accuracy between 0 and 1),
  stars           smallint check (stars between 0 and 3),
  notes_played    int not null default 0,
  notes_correct   int not null default 0,
  xp_earned       int not null default 0,
  hearts_lost     smallint not null default 0,
  input_method    input_method not null default 'midi',
  device_platform device_platform not null default 'ios',
  -- Hardware context
  had_led_strip   boolean not null default false,
  -- Raw note event log for future analytics (optional, nullable for MVP)
  note_events     jsonb
);
create index lesson_sessions_user_idx  on public.lesson_sessions(user_id, started_at desc);
create index lesson_sessions_lesson_idx on public.lesson_sessions(lesson_id);

-- ============================================================
-- SECTION 5: SONGS LIBRARY
-- ============================================================

create table public.songs (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  composer            text not null default '',
  arranger            text,
  cover_url           text,
  musicxml_url        text not null,
  audio_preview_url   text,
  difficulty          smallint not null default 1 check (difficulty between 1 and 5),
  genres              text[] not null default '{}',
  tags                text[] not null default '{}',
  chord_progression   text,
  bpm                 smallint,
  time_signature      text default '4/4',
  duration_seconds    int,
  global_play_count   bigint not null default 0,
  is_premium          boolean not null default false,
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
-- Full-text search index on title + composer
create index songs_search_idx on public.songs using gin(
  (to_tsvector('english', title || ' ' || composer))
);
create index songs_difficulty_idx on public.songs(difficulty, is_premium);
create index songs_genres_idx     on public.songs using gin(genres);

-- Song favorites (user ♥ song)
create table public.song_favorites (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  song_id     uuid not null references public.songs(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, song_id)
);
create index song_favorites_song_idx on public.song_favorites(song_id);

-- Song play history
create table public.song_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  song_id         uuid not null references public.songs(id) on delete cascade,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  accuracy        numeric(5,4),
  stars           smallint check (stars between 0 and 3),
  input_method    input_method not null default 'midi',
  device_platform device_platform not null default 'ios',
  had_led_strip   boolean not null default false
);
create index song_sessions_user_idx on public.song_sessions(user_id, started_at desc);

-- ============================================================
-- SECTION 6: OMR — USER-UPLOADED SHEETS
-- ============================================================

create table public.uploaded_sheets (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  -- Original upload
  original_filename   text not null,
  storage_path        text not null,   -- Supabase Storage object path
  file_type           sheet_file_type not null,
  file_size_bytes     int,
  -- OMR pipeline output
  omr_status          omr_status not null default 'pending',
  omr_job_id          text,            -- external OMR service job ID
  omr_error           text,
  musicxml_path       text,            -- Storage path after OMR succeeds
  -- Metadata parsed from OMR result
  detected_title      text,
  detected_composer   text,
  detected_key        text,
  detected_time_sig   text,
  page_count          smallint,
  -- User-editable metadata
  custom_title        text,
  custom_composer     text,
  is_favorite         boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index uploaded_sheets_user_idx    on public.uploaded_sheets(user_id, created_at desc);
create index uploaded_sheets_omr_idx     on public.uploaded_sheets(omr_status)
  where omr_status in ('pending', 'processing');

create trigger uploaded_sheets_updated_at
  before update on public.uploaded_sheets
  for each row execute function public.set_updated_at();

-- ============================================================
-- SECTION 7: HARDWARE (BLE / LED STRIP)
-- ============================================================

create table public.hardware_devices (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  -- BLE identifiers
  ble_device_id       text not null,    -- platform UUID (iOS) or MAC (Android)
  display_name        text not null,    -- e.g. "Piano-Prof-A8F2"
  -- Hardware metadata
  firmware_version    text,
  led_count           smallint not null default 88,
  -- Calibration data: array of {keyIndex, ledOffset} correction values
  calibration         jsonb,
  -- State
  is_active           boolean not null default true,
  last_connected_at   timestamptz,
  last_battery_pct    smallint check (last_battery_pct between 0 and 100),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- One device ID per user
  unique(user_id, ble_device_id)
);
create index hardware_devices_user_idx on public.hardware_devices(user_id, is_active);

create trigger hardware_devices_updated_at
  before update on public.hardware_devices
  for each row execute function public.set_updated_at();

-- ============================================================
-- SECTION 8: ACHIEVEMENTS & QUESTS
-- ============================================================

-- Achievement catalog (static, managed by admins)
create table public.achievements (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  title             text not null,
  description       text not null,
  icon_name         text not null default 'star',
  mascot_mood       text not null default 'trophy',
  category          achievement_category not null,
  required_value    int not null default 1,
  xp_reward         int not null default 0,
  gem_reward        int not null default 0,
  is_hidden         boolean not null default false,  -- secret achievement
  created_at        timestamptz not null default now()
);

-- User achievement progress + unlocks
create table public.user_achievements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  achievement_id  uuid not null references public.achievements(id) on delete cascade,
  progress        int not null default 0,
  earned_at       timestamptz,      -- null = in progress
  notified_at     timestamptz,      -- null = pending in-app notification
  created_at      timestamptz not null default now(),
  unique(user_id, achievement_id)
);
create index user_achievements_user_idx   on public.user_achievements(user_id);
create index user_achievements_earned_idx on public.user_achievements(user_id, earned_at)
  where earned_at is not null;

-- Quest catalog
create table public.quests (
  id              uuid primary key default gen_random_uuid(),
  type            quest_type not null default 'daily',
  slug            text not null,
  title           text not null,
  description     text not null default '',
  icon_name       text not null default 'flame',
  color           text not null default '#58CC02',
  required_value  int not null default 1,
  reward_type     reward_type not null default 'xp',
  reward_amount   int not null default 10,
  -- null = rotates randomly; set date for fixed seasonal quests
  active_on       date,
  created_at      timestamptz not null default now()
);

-- Daily user quest progress
create table public.user_quest_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  quest_id        uuid not null references public.quests(id) on delete cascade,
  date            date not null default current_date,
  progress        int not null default 0,
  completed       boolean not null default false,
  completed_at    timestamptz,
  reward_claimed  boolean not null default false,
  created_at      timestamptz not null default now(),
  unique(user_id, quest_id, date)
);
create index user_quest_progress_user_date_idx
  on public.user_quest_progress(user_id, date desc);

-- ============================================================
-- SECTION 9: BUSINESS LOGIC FUNCTIONS
-- ============================================================

-- award_xp: Append to ledger, no aggregate mutations (view handles totals)
create or replace function public.award_xp(
  p_user_id     uuid,
  p_amount      int,
  p_source      xp_source,
  p_reference   uuid default null
)
returns int                            -- returns new total XP
language plpgsql security definer as $$
declare
  v_total int;
begin
  insert into public.xp_log(user_id, amount, source, reference_id)
  values (p_user_id, p_amount, p_source, p_reference);

  select coalesce(sum(amount), 0)
  into v_total
  from public.xp_log
  where user_id = p_user_id;

  return v_total;
end;
$$;

-- consume_heart: Deduct a heart, return remaining count (0 = out of hearts)
create or replace function public.consume_heart(p_user_id uuid)
returns smallint
language plpgsql security definer as $$
declare
  v_count smallint;
begin
  -- Refill hearts at rate of 1 per 30 min if below max
  update public.hearts
  set
    count = least(5, count + floor(
      extract(epoch from (now() - last_refill_at)) / 1800
    )::smallint),
    last_refill_at = case
      when count < 5 then last_refill_at + (
        floor(extract(epoch from (now() - last_refill_at)) / 1800) * interval '30 minutes'
      )
      else now()
    end,
    updated_at = now()
  where user_id = p_user_id;

  -- Now deduct
  update public.hearts
  set count = greatest(0, count - 1), updated_at = now()
  where user_id = p_user_id
  returning count into v_count;

  return coalesce(v_count, 0);
end;
$$;

-- update_streak: Called after any lesson/song completion
create or replace function public.update_streak(p_user_id uuid)
returns int                            -- returns new current streak
language plpgsql security definer as $$
declare
  v_today         date := current_date;
  v_last_date     date;
  v_current       int;
  v_longest       int;
  v_freeze_count  smallint;
  v_new_streak    int;
begin
  select last_activity_date, current_streak, longest_streak, freeze_count
  into v_last_date, v_current, v_longest, v_freeze_count
  from public.streaks
  where user_id = p_user_id;

  if not found then
    -- First ever lesson
    insert into public.streaks(user_id, current_streak, longest_streak, last_activity_date)
    values (p_user_id, 1, 1, v_today);
    return 1;
  end if;

  -- Already played today — streak unchanged
  if v_last_date = v_today then
    return v_current;
  end if;

  if v_last_date = v_today - 1 then
    -- Consecutive day
    v_new_streak := v_current + 1;
  elsif v_last_date = v_today - 2 and v_freeze_count > 0 then
    -- Missed one day but has a streak freeze
    v_new_streak    := v_current + 1;
    v_freeze_count  := v_freeze_count - 1;
  else
    -- Streak broken
    v_new_streak := 1;
  end if;

  update public.streaks
  set
    current_streak     = v_new_streak,
    longest_streak     = greatest(longest_streak, v_new_streak),
    last_activity_date = v_today,
    freeze_count       = v_freeze_count,
    updated_at         = now()
  where user_id = p_user_id;

  return v_new_streak;
end;
$$;

-- complete_lesson: Master function called by app on lesson finish
create or replace function public.complete_lesson(
  p_user_id         uuid,
  p_lesson_id       uuid,
  p_accuracy        numeric,
  p_notes_played    int,
  p_notes_correct   int,
  p_input_method    input_method,
  p_device_platform device_platform,
  p_had_led_strip   boolean default false
)
returns jsonb                          -- {session_id, xp_earned, stars, new_streak, new_hearts}
language plpgsql security definer as $$
declare
  v_session_id    uuid := gen_random_uuid();
  v_lesson        record;
  v_stars         smallint;
  v_xp            int;
  v_streak        int;
  v_hearts        smallint;
  v_result        jsonb;
begin
  select * into v_lesson from public.lessons where id = p_lesson_id;
  if not found then raise exception 'lesson not found: %', p_lesson_id; end if;

  -- Stars: 3 = 100%, 2 = ≥80%, 1 = ≥50%, 0 = below 50% (still counts as complete)
  v_stars := case
    when p_accuracy >= 1.0  then 3
    when p_accuracy >= 0.80 then 2
    when p_accuracy >= 0.50 then 1
    else 0
  end;

  -- XP: base reward × accuracy multiplier + perfect bonus
  v_xp := (v_lesson.xp_reward * greatest(0.5, p_accuracy))::int;
  if v_stars = 3 then v_xp := v_xp + 5; end if;  -- perfect bonus

  -- Persist session
  insert into public.lesson_sessions(
    id, user_id, lesson_id, completed_at, accuracy, stars,
    notes_played, notes_correct, xp_earned,
    input_method, device_platform, had_led_strip
  ) values (
    v_session_id, p_user_id, p_lesson_id, now(), p_accuracy, v_stars,
    p_notes_played, p_notes_correct, v_xp,
    p_input_method, p_device_platform, p_had_led_strip
  );

  -- Upsert progress row
  insert into public.lesson_progress(user_id, lesson_id, status, stars, best_accuracy, play_count, last_played_at)
  values (p_user_id, p_lesson_id, 'completed', v_stars, p_accuracy, 1, now())
  on conflict (user_id, lesson_id) do update set
    status          = 'completed',
    stars           = greatest(lesson_progress.stars, excluded.stars),
    best_accuracy   = greatest(coalesce(lesson_progress.best_accuracy, 0), excluded.best_accuracy),
    play_count      = lesson_progress.play_count + 1,
    last_played_at  = now(),
    updated_at      = now();

  -- Award XP
  perform public.award_xp(p_user_id, v_xp, 'lesson_complete', v_session_id);

  -- Update streak
  v_streak := public.update_streak(p_user_id);

  -- Streak bonus at 7-day intervals
  if v_streak > 0 and (v_streak % 7) = 0 then
    perform public.award_xp(p_user_id, 50, 'streak_bonus', null);
    v_xp := v_xp + 50;
  end if;

  -- Current heart count (for UI display)
  select count into v_hearts from public.hearts where user_id = p_user_id;

  v_result := jsonb_build_object(
    'session_id',  v_session_id,
    'xp_earned',   v_xp,
    'stars',       v_stars,
    'new_streak',  v_streak,
    'hearts',      coalesce(v_hearts, 5)
  );

  return v_result;
end;
$$;

-- Provision gamification rows on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  -- Profile skeleton (username defaults to part of email)
  insert into public.profiles(id, username, display_name)
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;

  -- Free tier subscription
  insert into public.subscriptions(user_id, tier, status)
  values (new.id, 'free', 'active')
  on conflict do nothing;

  -- Streak record
  insert into public.streaks(user_id)
  values (new.id)
  on conflict do nothing;

  -- Hearts (start full)
  insert into public.hearts(user_id, count)
  values (new.id, 5)
  on conflict do nothing;

  -- Gems (start with 0)
  insert into public.gems(user_id, balance)
  values (new.id, 0)
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- SECTION 10: VIEWS
-- ============================================================

-- User stats aggregate (used by profile screen, leaderboard)
create view public.user_stats as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.country_code,
  coalesce((select sum(amount) from public.xp_log x where x.user_id = p.id), 0) as total_xp,
  coalesce(s.current_streak, 0)  as current_streak,
  coalesce(s.longest_streak, 0)  as longest_streak,
  coalesce(h.count, 0)           as hearts,
  coalesce(g.balance, 0)         as gems,
  coalesce(sub.tier, 'free')     as subscription_tier,
  (
    select count(*) from public.lesson_progress lp
    where lp.user_id = p.id and lp.status = 'completed'
  ) as lessons_completed,
  (
    select count(*) from public.user_achievements ua
    where ua.user_id = p.id and ua.earned_at is not null
  ) as achievements_earned
from public.profiles p
left join public.streaks s      on s.user_id = p.id
left join public.hearts h       on h.user_id = p.id
left join public.gems g         on g.user_id = p.id
left join public.subscriptions sub on sub.user_id = p.id
  and sub.status in ('active', 'trialing');

-- Weekly XP for leaderboard (rolling 7 days)
create view public.weekly_xp as
select
  user_id,
  sum(amount) as xp_this_week
from public.xp_log
where created_at >= date_trunc('week', now())
  and amount > 0
group by user_id;

-- ============================================================
-- SECTION 11: ROW-LEVEL SECURITY
-- ============================================================

-- Enable RLS
alter table public.profiles           enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.streaks            enable row level security;
alter table public.xp_log             enable row level security;
alter table public.hearts             enable row level security;
alter table public.gems               enable row level security;
alter table public.lesson_progress    enable row level security;
alter table public.lesson_sessions    enable row level security;
alter table public.uploaded_sheets    enable row level security;
alter table public.hardware_devices   enable row level security;
alter table public.user_achievements  enable row level security;
alter table public.user_quest_progress enable row level security;
alter table public.song_favorites     enable row level security;
alter table public.song_sessions      enable row level security;
alter table public.leaderboard_snapshots enable row level security;

-- Profiles: read own + read others' public info (for leaderboard)
create policy "Users can view all profiles"
  on public.profiles for select using (true);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Private tables: own rows only
create policy "Own subscriptions"
  on public.subscriptions for all using (auth.uid() = user_id);
create policy "Own streaks"
  on public.streaks for all using (auth.uid() = user_id);
create policy "Own xp_log read"
  on public.xp_log for select using (auth.uid() = user_id);
create policy "Own hearts"
  on public.hearts for all using (auth.uid() = user_id);
create policy "Own gems"
  on public.gems for all using (auth.uid() = user_id);
create policy "Own lesson progress"
  on public.lesson_progress for all using (auth.uid() = user_id);
create policy "Own lesson sessions"
  on public.lesson_sessions for all using (auth.uid() = user_id);
create policy "Own uploaded sheets"
  on public.uploaded_sheets for all using (auth.uid() = user_id);
create policy "Own hardware devices"
  on public.hardware_devices for all using (auth.uid() = user_id);
create policy "Own achievements"
  on public.user_achievements for all using (auth.uid() = user_id);
create policy "Own quest progress"
  on public.user_quest_progress for all using (auth.uid() = user_id);
create policy "Own song favorites"
  on public.song_favorites for all using (auth.uid() = user_id);
create policy "Own song sessions"
  on public.song_sessions for all using (auth.uid() = user_id);

-- Leaderboard: visible to all authenticated users
create policy "Leaderboard readable by all"
  on public.leaderboard_snapshots for select
  using (auth.role() = 'authenticated');

-- Public catalog tables (no RLS needed — service role manages them)
alter table public.courses      enable row level security;
alter table public.sections     enable row level security;
alter table public.lessons      enable row level security;
alter table public.exercises    enable row level security;
alter table public.achievements enable row level security;
alter table public.quests       enable row level security;
alter table public.songs        enable row level security;

create policy "Courses public read"       on public.courses      for select using (true);
create policy "Sections public read"      on public.sections     for select using (true);
create policy "Lessons public read"       on public.lessons      for select using (true);
create policy "Exercises public read"     on public.exercises    for select using (true);
create policy "Achievements public read"  on public.achievements for select using (true);
create policy "Quests public read"        on public.quests       for select using (true);
create policy "Songs public read"         on public.songs        for select using (true);

-- ============================================================
-- SECTION 12: SEED — ACHIEVEMENT CATALOG
-- ============================================================

insert into public.achievements(slug, title, description, category, required_value, xp_reward, mascot_mood) values
  ('first_note',        'First Note',          'Complete your very first lesson',                  'milestone',  1,   10,  'cheer'),
  ('streak_7',          'Week Warrior',         'Maintain a 7-day streak',                          'streak',     7,   50,  'conduct'),
  ('streak_30',         'Monthly Maestro',      'Maintain a 30-day streak',                         'streak',     30,  200, 'trophy'),
  ('streak_100',        'Century Streak',       'Maintain a 100-day streak',                        'streak',     100, 500, 'wow'),
  ('perfect_lesson',    'Sharp Ears',           'Complete a lesson with 100%% accuracy',            'accuracy',   1,   25,  'star'),
  ('perfect_10',        'Flawless Ten',         'Complete 10 lessons with 100%% accuracy',          'accuracy',   10,  100, 'swoon'),
  ('lessons_10',        'Getting the Feel',     'Complete 10 lessons',                              'completion', 10,  30,  'happy'),
  ('lessons_50',        'Halfway Hero',         'Complete 50 lessons',                              'completion', 50,  100, 'cheer'),
  ('lessons_100',       'Century Learner',      'Complete 100 lessons',                             'completion', 100, 300, 'trophy'),
  ('songs_5',           'Repertoire Starter',   'Play 5 songs from the library',                    'completion', 5,   50,  'violin'),
  ('songs_25',          'Pianist Rising',       'Play 25 songs from the library',                   'completion', 25,  150, 'conduct'),
  ('connected_led',     'Lights On',            'Connect your Piano Professor LED strip',           'hardware',   1,   30,  'wow'),
  ('led_10_sessions',   'Light Chaser',         'Complete 10 sessions with LED strip connected',    'hardware',   10,  75,  'star'),
  ('omr_first',         'Sheet Reader',         'Upload and convert your first sheet music',        'milestone',  1,   40,  'idea'),
  ('omr_10',            'Music Librarian',      'Upload and convert 10 sheets',                     'milestone',  10,  100, 'bard');

-- ============================================================
-- END OF MIGRATION
-- ============================================================
