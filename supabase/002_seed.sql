-- ============================================================
-- 002_seed.sql  (revised — more upcoming, fewer past, escalated actions in future)
-- ============================================================

do $$ begin

-- -------------------------------------------------------
-- Clean up
-- -------------------------------------------------------
delete from agent_actions where jobseeker_id in (
  'aaaaaaaa-0001-0000-0000-000000000000',
  'aaaaaaaa-0002-0000-0000-000000000000',
  'aaaaaaaa-0003-0000-0000-000000000000',
  'aaaaaaaa-0004-0000-0000-000000000000',
  'aaaaaaaa-0005-0000-0000-000000000000'
);
delete from outreach   where jobseeker_id in (
  'aaaaaaaa-0001-0000-0000-000000000000','aaaaaaaa-0002-0000-0000-000000000000',
  'aaaaaaaa-0003-0000-0000-000000000000','aaaaaaaa-0004-0000-0000-000000000000',
  'aaaaaaaa-0005-0000-0000-000000000000');
delete from followups  where jobseeker_id in (
  'aaaaaaaa-0001-0000-0000-000000000000','aaaaaaaa-0002-0000-0000-000000000000',
  'aaaaaaaa-0003-0000-0000-000000000000','aaaaaaaa-0004-0000-0000-000000000000',
  'aaaaaaaa-0005-0000-0000-000000000000');
delete from referrals  where jobseeker_id in (
  'aaaaaaaa-0001-0000-0000-000000000000','aaaaaaaa-0002-0000-0000-000000000000',
  'aaaaaaaa-0003-0000-0000-000000000000','aaaaaaaa-0004-0000-0000-000000000000',
  'aaaaaaaa-0005-0000-0000-000000000000');
delete from case_notes where jobseeker_id in (
  'aaaaaaaa-0001-0000-0000-000000000000','aaaaaaaa-0002-0000-0000-000000000000',
  'aaaaaaaa-0003-0000-0000-000000000000','aaaaaaaa-0004-0000-0000-000000000000',
  'aaaaaaaa-0005-0000-0000-000000000000');
delete from eaps       where jobseeker_id in (
  'aaaaaaaa-0001-0000-0000-000000000000','aaaaaaaa-0002-0000-0000-000000000000',
  'aaaaaaaa-0003-0000-0000-000000000000','aaaaaaaa-0004-0000-0000-000000000000',
  'aaaaaaaa-0005-0000-0000-000000000000');
delete from jobseekers where id in (
  'aaaaaaaa-0001-0000-0000-000000000000','aaaaaaaa-0002-0000-0000-000000000000',
  'aaaaaaaa-0003-0000-0000-000000000000','aaaaaaaa-0004-0000-0000-000000000000',
  'aaaaaaaa-0005-0000-0000-000000000000');


-- ================================================================
-- 1. Maria Alvarez — Dislocated Worker · HIGH
-- ================================================================
insert into jobseekers (id, name, tag, situation, days_since_contact, flag_ready, flag_barrier)
values (
  'aaaaaaaa-0001-0000-0000-000000000000',
  'Maria Alvarez', 'Dislocated Worker',
  'Laid off from Atlas Manufacturing three months ago. Career Passport complete, Roadmap published; resume upload Next Step stalled. Went quiet 23 days ago.',
  23, false, null
);
insert into eaps (jobseeker_id, goals, next_steps, stalled) values (
  'aaaaaaaa-0001-0000-0000-000000000000',
  array['Secure a logistics or supply chain coordinator role'],
  array['Complete resume upload Next Step','Submit three job applications per week via Work tab'],
  true
);

-- 1 past event
insert into case_notes (jobseeker_id, summary, author, created_at) values
  ('aaaaaaaa-0001-0000-0000-000000000000',
   'Career Passport intake complete. Logistics pathway selected in JOURNEY stage. Resume upload Next Step (UPLOAD type) assigned.',
   'human', now() - interval '75 days');

-- 4 upcoming followups
insert into followups (jobseeker_id, due_at, purpose, completed, author, created_at) values
  ('aaaaaaaa-0001-0000-0000-000000000000', now() + interval '3 days',
   'Resume upload session — work on resume together and complete the UPLOAD Next Step', false, 'human', now() - interval '23 days'),
  ('aaaaaaaa-0001-0000-0000-000000000000', now() + interval '7 days',
   'Job applications check-in — confirm first three applications submitted via Work tab', false, 'human', now() - interval '23 days'),
  ('aaaaaaaa-0001-0000-0000-000000000000', now() + interval '14 days',
   'Roadmap review — update Next Steps based on application responses', false, 'human', now() - interval '23 days'),
  ('aaaaaaaa-0001-0000-0000-000000000000', now() + interval '21 days',
   'Progress check — assess momentum, expand employer targets if needed', false, 'human', now() - interval '23 days');

-- 1 escalated agent action in future (shows Override in upcoming section)
insert into agent_actions (jobseeker_id, tool, input, confidence, status, rationale, cycle_summary, created_at) values
  ('aaaaaaaa-0001-0000-0000-000000000000', 'draft_outreach',
   '{"client_id":"aaaaaaaa-0001-0000-0000-000000000000","channel":"sms","message":"Hi Maria, your resume upload Next Step has been open for six weeks — can we book 30 minutes this week to finish it together? Reply YES and I''ll send a calendar link.","rationale":"23 days no contact and resume upload stalled; SMS is more immediate than email for re-engagement.","confidence":0.68}',
   0.68, 'escalated', '23 days no contact and resume upload stalled; SMS is more immediate than email for re-engagement.',
   'Handling re-engagement for Maria.', now() + interval '4 days');


-- ================================================================
-- 2. James Okafor — Recent Grad · Job-Ready · LOW
-- ================================================================
insert into jobseekers (id, name, tag, situation, days_since_contact, flag_ready, flag_barrier)
values (
  'aaaaaaaa-0002-0000-0000-000000000000',
  'James Okafor', 'Recent Grad · Job-Ready',
  'Completed CNC machining certificate. Career Passport complete, Roadmap active. In final interview stage with Precision Co. On track.',
  2, false, null
);
insert into eaps (jobseeker_id, goals, next_steps, stalled) values (
  'aaaaaaaa-0002-0000-0000-000000000000',
  array['Land first CNC machinist role'],
  array['Awaiting offer decision — Precision Co.'],
  false
);

-- 1 past event
insert into case_notes (jobseeker_id, summary, author, created_at) values
  ('aaaaaaaa-0002-0000-0000-000000000000',
   'CNC competency self-assessment Next Step completed — strong result. Interview prep resources added to Roadmap. Employer referrals initiated with three local CNC shops.',
   'human', now() - interval '30 days');

-- Completed follow-up
insert into followups (jobseeker_id, due_at, purpose, completed, author, created_at) values
  ('aaaaaaaa-0002-0000-0000-000000000000', now() - interval '2 days',
   'Check in after Precision Co. second interview', true, 'human', now() - interval '5 days');

-- 3 upcoming followups
insert into followups (jobseeker_id, due_at, purpose, completed, author, created_at) values
  ('aaaaaaaa-0002-0000-0000-000000000000', now() + interval '4 days',
   'Offer decision follow-up — Precision Co.', false, 'human', now() - interval '2 days'),
  ('aaaaaaaa-0002-0000-0000-000000000000', now() + interval '10 days',
   'If no offer: expand Work tab search to additional CNC employers', false, 'human', now() - interval '2 days'),
  ('aaaaaaaa-0002-0000-0000-000000000000', now() + interval '18 days',
   'Placement outcome confirmation — record employed outcome in Career Passport', false, 'human', now() - interval '2 days');


-- ================================================================
-- 3. Aisha Rahimi — Newcomer · ESL · CRITICAL
-- ================================================================
insert into jobseekers (id, name, tag, situation, days_since_contact, flag_ready, flag_barrier)
values (
  'aaaaaaaa-0003-0000-0000-000000000000',
  'Aisha Rahimi', 'Newcomer · ESL',
  'Newcomer with intermediate English. Six years accounting experience abroad. PROFILE stage complete, JOURNEY stage not done — no Roadmap yet. Foreign credential recognition is complex. 34 days without contact.',
  34, false, null
);
-- No EAP — triggers +40 priority bonus

-- 1 past event
insert into case_notes (jobseeker_id, summary, author, created_at) values
  ('aaaaaaaa-0003-0000-0000-000000000000',
   'Partial onboarding — PROFILE stage complete, JOURNEY stage not yet finished. CPA-equivalent credential recognition flagged as complex, high-stakes barrier. ESL support needs noted. Phone outreach attempted — no answer.',
   'human', now() - interval '34 days');

-- 4 upcoming followups
insert into followups (jobseeker_id, due_at, purpose, completed, author, created_at) values
  ('aaaaaaaa-0003-0000-0000-000000000000', now() + interval '2 days',
   'Re-engagement contact — schedule JOURNEY stage session and first Roadmap draft', false, 'human', now() - interval '34 days'),
  ('aaaaaaaa-0003-0000-0000-000000000000', now() + interval '7 days',
   'JOURNEY stage completion — select accounting pathway, confirm career goals', false, 'human', now() - interval '34 days'),
  ('aaaaaaaa-0003-0000-0000-000000000000', now() + interval '14 days',
   'Credential recognition pathway review — identify CPA Canada requirements, add FORM Next Step to Roadmap', false, 'human', now() - interval '34 days'),
  ('aaaaaaaa-0003-0000-0000-000000000000', now() + interval '21 days',
   'First Roadmap published — ESL program referral and credential recognition Next Steps active', false, 'human', now() - interval '34 days');

-- 1 escalated agent action in future
insert into agent_actions (jobseeker_id, tool, input, confidence, status, rationale, cycle_summary, created_at) values
  ('aaaaaaaa-0003-0000-0000-000000000000', 'refer_to_program',
   '{"client_id":"aaaaaaaa-0003-0000-0000-000000000000","program":"ESL Bridging Program — Accounting Track","reason":"Intermediate English proficiency is limiting credential recognition progress; bridging ESL specific to accounting terminology would accelerate pathway.","rationale":"High-stakes referral — credential and language barriers are linked. Flagged for coach review before submission.","confidence":0.71}',
   0.71, 'escalated', 'High-stakes referral — credential and language barriers are linked. Flagged for coach review before submission.',
   'Flagging ESL referral for Aisha for coach sign-off.', now() + interval '5 days');


-- ================================================================
-- 4. Robert Chen — Veteran · Ready · HIGH
-- ================================================================
insert into jobseekers (id, name, tag, situation, days_since_contact, flag_ready, flag_barrier)
values (
  'aaaaaaaa-0004-0000-0000-000000000000',
  'Robert Chen', 'Veteran · Ready',
  'Veteran. CompTIA A+ certified, IT bootcamp complete 10 days ago. Placement-ready. Veteran hiring partner service referral pending coach sign-off.',
  11, true, null
);
insert into eaps (jobseeker_id, goals, next_steps, stalled) values (
  'aaaaaaaa-0004-0000-0000-000000000000',
  array['Secure IT help-desk placement within 30 days'],
  array['Veteran hiring partner service referral (pending coach sign-off)','Submit IT support applications via Work tab'],
  true
);

-- 1 past event
insert into case_notes (jobseeker_id, summary, author, created_at) values
  ('aaaaaaaa-0004-0000-0000-000000000000',
   'CompTIA A+ certification achieved. Bootcamp graduation confirmed. Roadmap updated with employer matching and Work tab application Next Steps. Marked placement-ready. Veteran hiring partner referral flagged for coach sign-off.',
   'human', now() - interval '11 days');

-- 4 upcoming followups
insert into followups (jobseeker_id, due_at, purpose, completed, author, created_at) values
  ('aaaaaaaa-0004-0000-0000-000000000000', now() + interval '3 days',
   'Veteran hiring partner referral sign-off — initiate submission once approved', false, 'human', now() - interval '11 days'),
  ('aaaaaaaa-0004-0000-0000-000000000000', now() + interval '7 days',
   'IT support applications — review Work tab shortlist, confirm three submitted', false, 'human', now() - interval '11 days'),
  ('aaaaaaaa-0004-0000-0000-000000000000', now() + interval '14 days',
   'Interview preparation — targeted prep for help-desk support roles', false, 'human', now() - interval '11 days'),
  ('aaaaaaaa-0004-0000-0000-000000000000', now() + interval '21 days',
   'Placement outcome check — confirm offer or expand employer targets', false, 'human', now() - interval '11 days');

-- 1 escalated agent action in future
insert into agent_actions (jobseeker_id, tool, input, confidence, status, rationale, cycle_summary, created_at) values
  ('aaaaaaaa-0004-0000-0000-000000000000', 'refer_to_program',
   '{"client_id":"aaaaaaaa-0004-0000-0000-000000000000","program":"Veteran Hiring Partner Network — IT Track","reason":"Robert is placement-ready with CompTIA A+ certification. Veteran employer partner referral is the fastest path to a matched IT help-desk role.","rationale":"External commitment to employer network — requires coach sign-off before submission.","confidence":0.78}',
   0.78, 'escalated', 'External commitment to employer network — requires coach sign-off before submission.',
   'Veteran hiring partner referral ready for Robert — awaiting coach approval.', now() + interval '3 days');


-- ================================================================
-- 5. Linh Tran — Single Parent · Barrier · HIGH
-- ================================================================
insert into jobseekers (id, name, tag, situation, days_since_contact, flag_ready, flag_barrier)
values (
  'aaaaaaaa-0005-0000-0000-000000000000',
  'Linh Tran', 'Single Parent · Barrier',
  'Single parent. Childcare blocks morning medical admin cohort. Roadmap published; childcare service referral is the active barrier. 27 days without contact.',
  27, false, 'childcare'
);
insert into eaps (jobseeker_id, goals, next_steps, stalled) values (
  'aaaaaaaa-0005-0000-0000-000000000000',
  array['Enrol in medical admin training cohort and complete certification'],
  array['Confirm childcare support service referral outcome','Enrol in medical admin cohort once barrier resolved'],
  true
);

-- 2 past events
insert into case_notes (jobseeker_id, summary, author, created_at) values
  ('aaaaaaaa-0005-0000-0000-000000000000',
   'Career Passport intake complete. Healthcare Administration pathway selected. Medical admin training identified as primary goal. Childcare barrier documented.',
   'human', now() - interval '70 days'),
  ('aaaaaaaa-0005-0000-0000-000000000000',
   'Roadmap published with medical admin enrolment Next Step (FORM type). Childcare support service referral submitted; awaiting confirmation.',
   'human', now() - interval '40 days');

insert into referrals (jobseeker_id, program, reason, author, created_at) values
  ('aaaaaaaa-0005-0000-0000-000000000000',
   'Childcare Support Services',
   'Client requires subsidised childcare to attend morning medical admin cohort. Standard referral — unblocks the Roadmap enrolment Next Step.',
   'human', now() - interval '40 days');

-- 4 upcoming followups
insert into followups (jobseeker_id, due_at, purpose, completed, author, created_at) values
  ('aaaaaaaa-0005-0000-0000-000000000000', now() + interval '4 days',
   'Childcare referral status — confirm provider response; update Roadmap Next Step from projected to assigned', false, 'human', now() - interval '27 days'),
  ('aaaaaaaa-0005-0000-0000-000000000000', now() + interval '10 days',
   'Cohort enrolment — complete FORM Next Step and confirm start date if barrier resolved', false, 'human', now() - interval '27 days'),
  ('aaaaaaaa-0005-0000-0000-000000000000', now() + interval '17 days',
   'Attendance plan — confirm logistics for first week of morning cohort', false, 'human', now() - interval '27 days'),
  ('aaaaaaaa-0005-0000-0000-000000000000', now() + interval '24 days',
   'Progress check-in — confirm cohort attendance is on track', false, 'human', now() - interval '27 days');

-- 1 escalated agent action in future
insert into agent_actions (jobseeker_id, tool, input, confidence, status, rationale, cycle_summary, created_at) values
  ('aaaaaaaa-0005-0000-0000-000000000000', 'draft_outreach',
   '{"client_id":"aaaaaaaa-0005-0000-0000-000000000000","channel":"sms","message":"Hi Linh, the childcare referral has been submitted for 4 weeks with no update. I want to follow up directly with the provider on your behalf — is that OK? Reply YES and I''ll chase them today.","rationale":"27 days no contact and referral status unknown; proactive provider follow-up on client''s behalf may unblock faster than waiting.","confidence":0.69}',
   0.69, 'escalated', '27 days no contact and referral status unknown; proactive provider follow-up may unblock faster than waiting.',
   'Escalating childcare referral follow-up for Linh — needs coach approval.', now() + interval '4 days');

end $$;
