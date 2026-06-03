-- ============================================================
-- 002_seed.sql  (revised — FutureFit terminology)
-- Terminology: Coach (not counselor), Roadmap (not EAP),
-- Next Steps (not EAP steps), Career Passport (not profile),
-- Service referral (not program referral), JOURNEY / PROFILE
-- stages from real OnboardingRoutes.
-- ============================================================

do $$ begin

-- -------------------------------------------------------
-- Clean up existing seed data (safe to re-run)
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
-- 1. Maria Alvarez — Dislocated Worker
-- Score: +25 (stalled Roadmap) + min(23,40)*1.2 = 52.6 → HIGH
-- ================================================================
insert into jobseekers (id, name, tag, situation, days_since_contact, flag_ready, flag_barrier)
values (
  'aaaaaaaa-0001-0000-0000-000000000000',
  'Maria Alvarez',
  'Dislocated Worker',
  'Laid off from Atlas Manufacturing three months ago. Strong logistics background. Career Passport complete and Roadmap published; resume upload Next Step stalled for six weeks. Went quiet 23 days ago.',
  23, false, null
);

insert into eaps (jobseeker_id, goals, next_steps, stalled)
values (
  'aaaaaaaa-0001-0000-0000-000000000000',
  array['Secure a logistics or supply chain coordinator role'],
  array['Complete resume upload Next Step on Roadmap','Submit three job applications per week via Work tab'],
  true
);

-- History: onboarding → roadmap published → stall flagged → re-engagement outreach
insert into case_notes (jobseeker_id, summary, author, created_at) values
  ('aaaaaaaa-0001-0000-0000-000000000000',
   'Career Passport intake complete. Logistics and supply chain pathway selected in JOURNEY stage. Eight years of work history at Atlas Manufacturing captured under Work Experience. Resume upload Next Step (UPLOAD type) assigned and added to draft Roadmap.',
   'human', now() - interval '90 days'),
  ('aaaaaaaa-0001-0000-0000-000000000000',
   'Roadmap drafted and published. Two active Next Steps: resume upload (UPLOAD type) and three job applications per week via Work tab (LINK type). Client attended roadmap review — engaged and motivated to return to logistics.',
   'human', now() - interval '75 days'),
  ('aaaaaaaa-0001-0000-0000-000000000000',
   'Check-in call — client mentioned difficulty updating resume independently. Offered a supported session. No booking made. Resume upload Next Step still in assigned status.',
   'human', now() - interval '55 days');

insert into outreach (jobseeker_id, channel, message, author, created_at) values
  ('aaaaaaaa-0001-0000-0000-000000000000',
   'email',
   'Hi Maria, checking in on your Roadmap — your resume upload Next Step is still open and we''d love to help you complete it. Happy to set up a session to work on it together whenever you''re ready. Reply or call anytime.',
   'human', now() - interval '23 days');

-- Upcoming: resume session + job applications check-in
insert into followups (jobseeker_id, due_at, purpose, completed, author, created_at) values
  ('aaaaaaaa-0001-0000-0000-000000000000',
   now() + interval '5 days',
   'Resume upload Next Step — book supported session to rebuild the resume and complete the UPLOAD Next Step',
   false, 'human', now() - interval '23 days'),
  ('aaaaaaaa-0001-0000-0000-000000000000',
   now() + interval '14 days',
   'Job applications check-in — review Work tab activity; confirm three applications submitted this week',
   false, 'human', now() - interval '23 days');


-- ================================================================
-- 2. James Okafor — Recent Grad · Job-Ready
-- Score: 0 (non-stalled Roadmap) + min(2,40)*1.2 = 2.4 → LOW
-- ================================================================
insert into jobseekers (id, name, tag, situation, days_since_contact, flag_ready, flag_barrier)
values (
  'aaaaaaaa-0002-0000-0000-000000000000',
  'James Okafor',
  'Recent Grad · Job-Ready',
  'Completed CNC machining certificate. Career Passport complete, Roadmap active. In final interview stage with Precision Co. — second interview went well. On track; no coach action needed.',
  2, false, null
);

insert into eaps (jobseeker_id, goals, next_steps, stalled)
values (
  'aaaaaaaa-0002-0000-0000-000000000000',
  array['Land first CNC machinist role'],
  array['Awaiting offer decision — Precision Co.'],
  false
);

-- History: onboarding → assessment completed → roadmap updated → positive check-in
insert into case_notes (jobseeker_id, summary, author, created_at) values
  ('aaaaaaaa-0002-0000-0000-000000000000',
   'Career Passport intake complete. CNC Manufacturing pathway selected in JOURNEY stage. Resume reviewed and uploaded — strong machining competencies and tooling knowledge captured under Work Experience.',
   'human', now() - interval '45 days'),
  ('aaaaaaaa-0002-0000-0000-000000000000',
   'CNC competency self-assessment Next Step (ASSESSMENT type) completed — strong result. Interview prep resources Next Step (LINK type) added to Roadmap and republished. Employer referral connections initiated with three local CNC shops.',
   'human', now() - interval '30 days');

-- Completed follow-up from 2 days ago
insert into followups (jobseeker_id, due_at, purpose, completed, author, created_at) values
  ('aaaaaaaa-0002-0000-0000-000000000000',
   now() - interval '2 days',
   'Check in after Precision Co. second interview — confirm outcome and update Roadmap Next Steps accordingly',
   true, 'human', now() - interval '5 days');

-- Upcoming: offer decision
insert into followups (jobseeker_id, due_at, purpose, completed, author, created_at) values
  ('aaaaaaaa-0002-0000-0000-000000000000',
   now() + interval '5 days',
   'Offer decision follow-up — Precision Co.; if no offer, expand Work tab search to additional CNC employers',
   false, 'human', now() - interval '2 days');


-- ================================================================
-- 3. Aisha Rahimi — Newcomer · ESL
-- Score: +40 (no Roadmap) + min(34,40)*1.2 = 80.8 → CRITICAL
-- ================================================================
insert into jobseekers (id, name, tag, situation, days_since_contact, flag_ready, flag_barrier)
values (
  'aaaaaaaa-0003-0000-0000-000000000000',
  'Aisha Rahimi',
  'Newcomer · ESL',
  'Newcomer with intermediate English. Six years of accounting experience abroad. PROFILE stage complete but JOURNEY stage not finished — no Roadmap published yet. Foreign credential recognition is complex and high-stakes. 34 days without contact.',
  34, false, null
);

-- No Roadmap (eap) for Aisha — triggers the +40 priority bonus

-- History: partial onboarding → coach note → failed outreach
insert into case_notes (jobseeker_id, summary, author, created_at) values
  ('aaaaaaaa-0003-0000-0000-000000000000',
   'Partial onboarding — PROFILE stage complete, JOURNEY stage not yet finished. Six years of accounting experience abroad (Afghanistan) documented in Career Passport under Work Experience. Foreign credential recognition for CPA-equivalent designation flagged as a complex, high-stakes barrier. English reading strong; spoken proficiency developing. ESL support needs noted.',
   'human', now() - interval '40 days'),
  ('aaaaaaaa-0003-0000-0000-000000000000',
   'Phone outreach attempted — no answer, voicemail left. Follow-up email sent. No Roadmap published yet and no pathway selected. 34 days without contact; disengagement risk flagged. Credential recognition pathway research needed before JOURNEY stage can be completed meaningfully.',
   'human', now() - interval '34 days');

-- Upcoming: re-engagement → JOURNEY stage → credential pathway review
insert into followups (jobseeker_id, due_at, purpose, completed, author, created_at) values
  ('aaaaaaaa-0003-0000-0000-000000000000',
   now() + interval '2 days',
   'Re-engagement contact — schedule JOURNEY stage completion session and first Roadmap draft',
   false, 'human', now() - interval '34 days'),
  ('aaaaaaaa-0003-0000-0000-000000000000',
   now() + interval '14 days',
   'Credential recognition pathway review — identify relevant professional body (CPA Canada or provincial equivalent) and required steps; add as Next Step (FORM type) on Roadmap',
   false, 'human', now() - interval '34 days');


-- ================================================================
-- 4. Robert Chen — Veteran · Ready
-- Score: +25 (stalled Roadmap) + min(11,40)*1.2 + 25 (ready) = 63.2 → HIGH
-- ================================================================
insert into jobseekers (id, name, tag, situation, days_since_contact, flag_ready, flag_barrier)
values (
  'aaaaaaaa-0004-0000-0000-000000000000',
  'Robert Chen',
  'Veteran · Ready',
  'Veteran. CompTIA A+ certified after IT support bootcamp, completed 10 days ago. Career Passport complete and placement-ready. Roadmap published with employer matching Next Steps. Veteran hiring partner service referral pending coach sign-off.',
  11, true, null
);

insert into eaps (jobseeker_id, goals, next_steps, stalled)
values (
  'aaaaaaaa-0004-0000-0000-000000000000',
  array['Secure IT help-desk placement within 30 days'],
  array['Veteran hiring partner service referral (pending coach sign-off)','Submit IT support applications via Work tab'],
  true
);

-- History: onboarding → assessment assigned → bootcamp complete → roadmap updated
insert into case_notes (jobseeker_id, summary, author, created_at) values
  ('aaaaaaaa-0004-0000-0000-000000000000',
   'Career Passport intake complete. IT Support pathway selected in JOURNEY stage. Six years of military service documented under Work Experience. IT bootcamp enrolment confirmed. CompTIA A+ assessment Next Step (ASSESSMENT type) assigned and added to draft Roadmap.',
   'human', now() - interval '50 days'),
  ('aaaaaaaa-0004-0000-0000-000000000000',
   'CompTIA A+ certification achieved — added to Career Passport under Certifications. Bootcamp graduation confirmed. Roadmap updated: employer matching Next Step (TEXT type) and IT support job applications via Work tab Next Step (LINK type) added and published. Client marked placement-ready. Veteran hiring partner service referral flagged for coach sign-off — external commitment requires approval before submission.',
   'human', now() - interval '11 days');

-- Upcoming: veteran referral sign-off → Work tab applications
insert into followups (jobseeker_id, due_at, purpose, completed, author, created_at) values
  ('aaaaaaaa-0004-0000-0000-000000000000',
   now() + interval '3 days',
   'Veteran hiring partner service referral — coach sign-off required; initiate submission to employer network once approved',
   false, 'human', now() - interval '11 days'),
  ('aaaaaaaa-0004-0000-0000-000000000000',
   now() + interval '7 days',
   'IT support role applications — review Work tab shortlist with client; confirm three applications submitted',
   false, 'human', now() - interval '11 days');


-- ================================================================
-- 5. Linh Tran — Single Parent · Barrier
-- Score: +25 (stalled Roadmap) + min(27,40)*1.2 = 57.4 → HIGH
-- ================================================================
insert into jobseekers (id, name, tag, situation, days_since_contact, flag_ready, flag_barrier)
values (
  'aaaaaaaa-0005-0000-0000-000000000000',
  'Linh Tran',
  'Single Parent · Barrier',
  'Single parent with two children. Childcare obligation blocks morning medical admin cohort. Career Passport complete, Roadmap published. Childcare support service referral is the active barrier — Roadmap Next Steps stalled pending resolution. 27 days without contact.',
  27, false, 'childcare'
);

insert into eaps (jobseeker_id, goals, next_steps, stalled)
values (
  'aaaaaaaa-0005-0000-0000-000000000000',
  array['Enrol in medical admin training cohort and complete certification'],
  array['Confirm childcare support service referral outcome','Enrol in medical admin cohort once barrier resolved'],
  true
);

-- History: onboarding → roadmap published with barrier → service referral created → outreach
insert into case_notes (jobseeker_id, summary, author, created_at) values
  ('aaaaaaaa-0005-0000-0000-000000000000',
   'Career Passport intake complete. Healthcare Administration pathway selected in JOURNEY stage. Medical admin training identified as primary goal. Childcare obligation for two children (ages 4 and 7) documented — blocks morning cohort attendance. Subsidised childcare service referral identified as the required next step.',
   'human', now() - interval '70 days'),
  ('aaaaaaaa-0005-0000-0000-000000000000',
   'Roadmap drafted with medical admin training enrolment Next Step (FORM type). Childcare support service referral added to client record. Roadmap published — cohort enrolment Next Step marked projected until referral confirmed. Referral submitted to provider; awaiting confirmation.',
   'human', now() - interval '40 days');

-- Service referral recorded at the time of Roadmap publication
insert into referrals (jobseeker_id, program, reason, author, created_at) values
  ('aaaaaaaa-0005-0000-0000-000000000000',
   'Childcare Support Services',
   'Client requires subsidised childcare arrangement to attend morning medical admin cohort. Standard referral — unblocks the Roadmap''s enrolment Next Step.',
   'human', now() - interval '40 days');

insert into outreach (jobseeker_id, channel, message, author, created_at) values
  ('aaaaaaaa-0005-0000-0000-000000000000',
   'sms',
   'Hi Linh, following up on your childcare support service referral — have you heard back from the provider yet? We need to confirm soon to hold your cohort seat. Let us know how we can help.',
   'human', now() - interval '27 days');

-- Upcoming: referral status → cohort enrolment
insert into followups (jobseeker_id, due_at, purpose, completed, author, created_at) values
  ('aaaaaaaa-0005-0000-0000-000000000000',
   now() + interval '5 days',
   'Childcare service referral status — confirm provider response and timeline; update Roadmap Next Step from projected to assigned',
   false, 'human', now() - interval '27 days'),
  ('aaaaaaaa-0005-0000-0000-000000000000',
   now() + interval '14 days',
   'Medical admin cohort enrolment — complete FORM Next Step and confirm start date once childcare barrier resolved',
   false, 'human', now() - interval '27 days');

end $$;
