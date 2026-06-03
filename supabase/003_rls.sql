-- ============================================================
-- 003_rls.sql
-- Run AFTER 002_seed.sql — and only once Auth is wired up.
-- Until then, tables are readable/writable by the service role
-- key from the server only.
-- ============================================================

-- Enable RLS on all tables
alter table jobseekers    enable row level security;
alter table eaps          enable row level security;
alter table case_notes    enable row level security;
alter table referrals     enable row level security;
alter table followups     enable row level security;
alter table outreach      enable row level security;
alter table agent_actions enable row level security;

-- -------------------------------------------------------
-- jobseekers: counselor sees only their own caseload
-- -------------------------------------------------------
create policy "counselor_select_own" on jobseekers
  for select using (assigned_counselor = auth.uid());

create policy "counselor_update_own" on jobseekers
  for update using (assigned_counselor = auth.uid());

-- -------------------------------------------------------
-- All related tables: visible if the jobseeker is assigned to me
-- -------------------------------------------------------
create policy "eaps_select" on eaps
  for select using (
    exists (select 1 from jobseekers j where j.id = eaps.jobseeker_id and j.assigned_counselor = auth.uid())
  );
create policy "eaps_insert" on eaps
  for insert with check (
    exists (select 1 from jobseekers j where j.id = eaps.jobseeker_id and j.assigned_counselor = auth.uid())
  );
create policy "eaps_update" on eaps
  for update using (
    exists (select 1 from jobseekers j where j.id = eaps.jobseeker_id and j.assigned_counselor = auth.uid())
  );

create policy "case_notes_select" on case_notes
  for select using (
    exists (select 1 from jobseekers j where j.id = case_notes.jobseeker_id and j.assigned_counselor = auth.uid())
  );
create policy "case_notes_insert" on case_notes
  for insert with check (
    exists (select 1 from jobseekers j where j.id = case_notes.jobseeker_id and j.assigned_counselor = auth.uid())
  );

create policy "referrals_select" on referrals
  for select using (
    exists (select 1 from jobseekers j where j.id = referrals.jobseeker_id and j.assigned_counselor = auth.uid())
  );
create policy "referrals_insert" on referrals
  for insert with check (
    exists (select 1 from jobseekers j where j.id = referrals.jobseeker_id and j.assigned_counselor = auth.uid())
  );

create policy "followups_select" on followups
  for select using (
    exists (select 1 from jobseekers j where j.id = followups.jobseeker_id and j.assigned_counselor = auth.uid())
  );
create policy "followups_insert" on followups
  for insert with check (
    exists (select 1 from jobseekers j where j.id = followups.jobseeker_id and j.assigned_counselor = auth.uid())
  );
create policy "followups_update" on followups
  for update using (
    exists (select 1 from jobseekers j where j.id = followups.jobseeker_id and j.assigned_counselor = auth.uid())
  );

create policy "outreach_select" on outreach
  for select using (
    exists (select 1 from jobseekers j where j.id = outreach.jobseeker_id and j.assigned_counselor = auth.uid())
  );
create policy "outreach_insert" on outreach
  for insert with check (
    exists (select 1 from jobseekers j where j.id = outreach.jobseeker_id and j.assigned_counselor = auth.uid())
  );

create policy "agent_actions_select" on agent_actions
  for select using (
    exists (select 1 from jobseekers j where j.id = agent_actions.jobseeker_id and j.assigned_counselor = auth.uid())
  );
create policy "agent_actions_insert" on agent_actions
  for insert with check (
    exists (select 1 from jobseekers j where j.id = agent_actions.jobseeker_id and j.assigned_counselor = auth.uid())
  );
create policy "agent_actions_update" on agent_actions
  for update using (
    exists (select 1 from jobseekers j where j.id = agent_actions.jobseeker_id and j.assigned_counselor = auth.uid())
  );

-- -------------------------------------------------------
-- Service role bypass (used by the server-side Supabase client)
-- The service role key bypasses RLS automatically in Supabase —
-- no extra policy needed. This comment is a reminder that the
-- server must use SUPABASE_SERVICE_ROLE_KEY, not the anon key.
-- -------------------------------------------------------
