import type {
  AgentAction,
  CaseNote,
  Followup,
  Outreach,
  Referral,
  TimelineEvent,
} from './types'

const TOOL_LABELS: Record<string, string> = {
  create_case_note:  'Case Note',
  update_eap:        'Roadmap Update',
  refer_to_program:  'Service Referral',
  schedule_followup: 'Follow-up',
  draft_outreach:    'Outreach',
}

export function buildTimeline(
  caseNotes: CaseNote[],
  referrals: Referral[],
  followups: Followup[],
  outreach: Outreach[],
  agentActions: AgentAction[],
): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const now = new Date()

  for (const n of caseNotes) {
    events.push({
      id: n.id,
      type: 'case_note',
      actor: 'agent',
      state: 'done',
      label: 'Case Note',
      detail: n.summary,
      timestamp: n.created_at,
    })
  }

  for (const r of referrals) {
    events.push({
      id: r.id,
      type: 'referral',
      actor: r.author === 'agent' ? 'agent' : 'human',
      state: 'done',
      label: `Referral → ${r.program}`,
      detail: r.reason,
      timestamp: r.created_at,
    })
  }

  for (const f of followups) {
    const due = new Date(f.due_at)
    let state: TimelineEvent['state']
    if (f.completed) {
      state = 'done'
    } else if (due <= now) {
      state = 'pending'
    } else {
      state = 'upcoming'
    }
    events.push({
      id: f.id,
      type: 'followup',
      actor: f.author === 'agent' ? 'agent' : 'human',
      state,
      label: 'Follow-up',
      detail: f.purpose,
      timestamp: f.due_at,
    })
  }

  for (const o of outreach) {
    events.push({
      id: o.id,
      type: 'outreach',
      actor: 'human',
      state: 'done',
      label: `Outreach (${o.channel})`,
      detail: o.message,
      timestamp: o.created_at,
    })
  }

  for (const a of agentActions) {
    let state: TimelineEvent['state']
    if (a.status === 'overridden') state = 'skipped'
    else if (a.status === 'escalated') state = 'pending'
    else state = 'done'

    events.push({
      id: a.id,
      type: 'agent_action',
      actor: 'agent',
      state,
      label: TOOL_LABELS[a.tool] ?? a.tool,
      detail: a.rationale ?? '',
      timestamp: a.created_at,
      agentAction: a,
    })
  }

  return events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )
}
