-- ============================================================
-- 001_schema.sql
-- Run this first in the Supabase SQL editor.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- CORE TABLES
-- ============================================================

create table if not exists jobseekers (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  tag               text not null,          -- display classification label
  situation         text,                   -- free-text situation summary
  days_since_contact integer not null default 0,
  flag_ready        boolean not null default false,   -- ready for placement
  flag_barrier      text,                             -- e.g. 'childcare', null if none
  assigned_counselor uuid,                 -- FK to auth.users; nullable until auth wired
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists eaps (
  id            uuid primary key default gen_random_uuid(),
  jobseeker_id  uuid not null references jobseekers(id) on delete cascade,
  goals         text[] not null default '{}',
  next_steps    text[] not null default '{}',
  stalled       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One EAP per jobseeker max
create unique index if not exists eaps_jobseeker_id_key on eaps(jobseeker_id);

create table if not exists case_notes (
  id            uuid primary key default gen_random_uuid(),
  jobseeker_id  uuid not null references jobseekers(id) on delete cascade,
  summary       text not null,
  author        text not null default 'agent',   -- 'agent' | 'human'
  created_at    timestamptz not null default now()
);

create table if not exists referrals (
  id            uuid primary key default gen_random_uuid(),
  jobseeker_id  uuid not null references jobseekers(id) on delete cascade,
  program       text not null,
  reason        text not null,
  author        text not null default 'agent',
  created_at    timestamptz not null default now()
);

create table if not exists followups (
  id              uuid primary key default gen_random_uuid(),
  jobseeker_id    uuid not null references jobseekers(id) on delete cascade,
  due_at          timestamptz not null,
  purpose         text not null,
  completed       boolean not null default false,
  author          text not null default 'agent',
  created_at      timestamptz not null default now()
);

create table if not exists outreach (
  id            uuid primary key default gen_random_uuid(),
  jobseeker_id  uuid not null references jobseekers(id) on delete cascade,
  channel       text not null,    -- 'email' | 'sms' | 'phone' | etc.
  message       text not null,
  author        text not null default 'agent',
  created_at    timestamptz not null default now()
);

-- ============================================================
-- AUDIT / AGENT LOG
-- ============================================================

create table if not exists agent_actions (
  id              uuid primary key default gen_random_uuid(),
  jobseeker_id    uuid not null references jobseekers(id) on delete cascade,
  tool            text not null,       -- 'create_case_note' | 'update_eap' | 'refer_to_program' | 'schedule_followup' | 'draft_outreach'
  input           jsonb not null,      -- tool arguments as sent to / from the model
  output_id       uuid,               -- FK to the created output row (nullable until written)
  output_table    text,               -- 'case_notes' | 'referrals' | etc.
  confidence      numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  status          text not null default 'escalated'
                    check (status in ('auto','approved','escalated','overridden')),
  rationale       text,
  cycle_summary   text,               -- one-line summary the model emitted
  reversed_at     timestamptz,        -- set when a human overrides/reverts
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Index for the metric queries (Today / Week / Month / Year / All counts)
create index if not exists agent_actions_created_at_idx on agent_actions(created_at);
create index if not exists agent_actions_status_idx     on agent_actions(status);
create index if not exists agent_actions_jobseeker_idx  on agent_actions(jobseeker_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger jobseekers_updated_at before update on jobseekers
  for each row execute function set_updated_at();

create trigger eaps_updated_at before update on eaps
  for each row execute function set_updated_at();

create trigger agent_actions_updated_at before update on agent_actions
  for each row execute function set_updated_at();
