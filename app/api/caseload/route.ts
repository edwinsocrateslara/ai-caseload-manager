import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { computeScore, scoreToBand } from '@/lib/priority'
import { buildTimeline } from '@/lib/timeline'
import type {
  AgentAction,
  CaseNote,
  EAP,
  Followup,
  Jobseeker,
  Outreach,
  Referral,
  RankedJobseeker,
} from '@/lib/types'

export async function GET() {
  const supabase = createServerClient()

  const [
    { data: jobseekers, error: jsError },
    { data: eaps, error: eapError },
    { data: caseNotes, error: cnError },
    { data: referrals, error: refError },
    { data: followups, error: fuError },
    { data: outreach, error: outError },
    { data: agentActions, error: aaError },
  ] = await Promise.all([
    supabase.from('jobseekers').select('*'),
    supabase.from('eaps').select('*'),
    supabase.from('case_notes').select('*').order('created_at', { ascending: true }),
    supabase.from('referrals').select('*').order('created_at', { ascending: true }),
    supabase.from('followups').select('*').order('due_at', { ascending: true }),
    supabase.from('outreach').select('*').order('created_at', { ascending: true }),
    supabase.from('agent_actions').select('*').order('created_at', { ascending: true }),
  ])

  const firstError = jsError || eapError || cnError || refError || fuError || outError || aaError
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 })
  }

  const eapMap = new Map((eaps as EAP[]).map((e) => [e.jobseeker_id, e]))
  const allActions = agentActions as AgentAction[]

  const ranked: RankedJobseeker[] = (jobseekers as Jobseeker[]).map((js) => {
    const eap = eapMap.get(js.id) ?? null
    const score = computeScore(js, eap)
    const band = scoreToBand(score)
    const timeline = buildTimeline(
      (caseNotes as CaseNote[]).filter((n) => n.jobseeker_id === js.id),
      (referrals as Referral[]).filter((r) => r.jobseeker_id === js.id),
      (followups as Followup[]).filter((f) => f.jobseeker_id === js.id),
      (outreach as Outreach[]).filter((o) => o.jobseeker_id === js.id),
      allActions.filter((a) => a.jobseeker_id === js.id),
    )
    return { ...js, eap, score, band, timeline }
  })

  ranked.sort((a, b) => b.score - a.score)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const pendingEscalations = allActions.filter(
    (a) => a.status === 'escalated' && !a.reversed_at,
  ).length

  const agentActionsToday = allActions.filter(
    (a) => new Date(a.created_at) >= today && a.status !== 'overridden',
  ).length

  const bandCounts = ranked.reduce(
    (acc, js) => {
      acc[js.band] = (acc[js.band] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return NextResponse.json({
    jobseekers: ranked,
    metrics: {
      total: ranked.length,
      critical: bandCounts['Critical'] ?? 0,
      high: bandCounts['High'] ?? 0,
      moderate: bandCounts['Moderate'] ?? 0,
      low: bandCounts['Low'] ?? 0,
      pendingEscalations,
      agentActionsToday,
    },
  })
}
