import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { computeScore, scoreToBand } from '@/lib/priority'
import type { EAP, Jobseeker } from '@/lib/types'

const CLAUDE_MODEL = 'claude-sonnet-4-6'

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_case_note',
    description: 'Write a case note documenting the current situation or action taken for a jobseeker.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string', description: 'Jobseeker UUID' },
        summary: { type: 'string', description: 'Case note content' },
        rationale: { type: 'string', description: 'Why this action was chosen' },
        confidence: { type: 'number', description: 'Confidence 0.0–1.0' },
      },
      required: ['client_id', 'summary', 'rationale', 'confidence'],
    },
  },
  {
    name: 'update_eap',
    description: "Update the Next Steps on a jobseeker's Roadmap (their personalised action plan).",
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string' },
        next_steps: {
          type: 'array',
          items: { type: 'string' },
          description: 'Revised list of Roadmap Next Steps',
        },
        rationale: { type: 'string' },
        confidence: { type: 'number' },
      },
      required: ['client_id', 'next_steps', 'rationale', 'confidence'],
    },
  },
  {
    name: 'refer_to_program',
    description:
      'Create a service referral for a jobseeker (e.g. childcare support, ESL program, credential recognition body, veteran employer partner). HIGH STAKES — escalates automatically if confidence < 0.85.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string' },
        program: { type: 'string', description: 'Program name' },
        reason: { type: 'string', description: 'Reason for referral' },
        rationale: { type: 'string' },
        confidence: { type: 'number' },
      },
      required: ['client_id', 'program', 'reason', 'rationale', 'confidence'],
    },
  },
  {
    name: 'schedule_followup',
    description: 'Schedule a follow-up with a jobseeker.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string' },
        days_from_now: { type: 'number', description: 'Days from now until follow-up' },
        purpose: { type: 'string', description: 'Purpose of the follow-up' },
        rationale: { type: 'string' },
        confidence: { type: 'number' },
      },
      required: ['client_id', 'days_from_now', 'purpose', 'rationale', 'confidence'],
    },
  },
  {
    name: 'draft_outreach',
    description: 'Draft an outreach message to send to a jobseeker.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string' },
        channel: {
          type: 'string',
          enum: ['email', 'sms', 'phone'],
          description: 'Communication channel',
        },
        message: { type: 'string', description: 'Message content' },
        rationale: { type: 'string' },
        confidence: { type: 'number' },
      },
      required: ['client_id', 'channel', 'message', 'rationale', 'confidence'],
    },
  },
]

const SYSTEM_PROMPT = `You are an autonomous agent operating a coach's caseload on the FutureFit employment services platform. You decide and act on your own; the coach supervises and can override you.

Platform terminology you must use:
- "Roadmap" — the jobseeker's personalised action plan (not "EAP" or "employment action plan")
- "Next Steps" — individual Roadmap cards (types: ASSESSMENT, FORM, LINK, TEXT, UPLOAD)
- "Career Passport" — the jobseeker's profile of experience, skills, and goals
- "Service referral" — a referral to an external provider (e.g. childcare support, ESL program, credential recognition body, veteran employer partner)
- "Coach" — the human supervisor (not "counselor")
- Stages: PROFILE → JOURNEY → RESUME_REVIEW → EXPERIENCE → EDUCATION → FORM

Rules:
- Work clients in priority order (highest score first).
- Call exactly ONE tool per client who needs attention.
- Leave on-track clients alone — do not call any tool for them.
- Self-assess confidence (0.0–1.0) honestly. Low confidence auto-escalates for coach review.
- Open your response with one terse sentence summarising what you are handling this cycle.

Action guidance:
- No Roadmap yet: draft_outreach to re-engage, or schedule_followup to initiate JOURNEY stage and first Roadmap draft.
- Stalled Roadmap: identify the specific blocker — update_eap (revise Next Steps) or refer_to_program (service referral for the barrier).
- Placement-ready: schedule_followup to initiate employer matching or veteran hiring partner referral.
- Long no-contact (>20 days): draft_outreach first; use the client's preferred channel.
- Use refer_to_program conservatively — service referrals are external commitments. Be honest if uncertain.
- Write case notes, outreach messages, and Next Steps in plain language the jobseeker would understand.`

function shouldEscalate(tool: string, confidence: number): boolean {
  if (confidence < 0.72) return true
  if (tool === 'refer_to_program' && confidence < 0.85) return true
  return false
}

export async function POST() {
  const supabase = createServerClient()
  const anthropic = new Anthropic()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [{ data: jobseekers }, { data: eaps }, { data: todayActions }] = await Promise.all([
    supabase.from('jobseekers').select('*'),
    supabase.from('eaps').select('*'),
    supabase
      .from('agent_actions')
      .select('jobseeker_id, tool')
      .gte('created_at', todayStart.toISOString())
      .neq('status', 'overridden'),
  ])

  if (!jobseekers || !eaps) {
    return NextResponse.json({ error: 'Failed to load caseload' }, { status: 500 })
  }

  // Build a set of "already acted today" keys: `jobseeker_id:tool`
  // Used both to inform the model and to hard-block duplicate writes.
  const actedToday = new Set<string>(
    (todayActions ?? []).map((a) => `${a.jobseeker_id}:${a.tool}`)
  )

  // Group today's actions by jobseeker for the model context
  const todayByClient = new Map<string, string[]>()
  for (const a of todayActions ?? []) {
    const list = todayByClient.get(a.jobseeker_id) ?? []
    list.push(a.tool)
    todayByClient.set(a.jobseeker_id, list)
  }

  const eapMap = new Map((eaps as EAP[]).map((e) => [e.jobseeker_id, e]))

  const rankedCaseload = (jobseekers as Jobseeker[])
    .map((js) => {
      const eap = eapMap.get(js.id) ?? null
      const score = computeScore(js, eap)
      const band = scoreToBand(score)
      return {
        client_id: js.id,
        name: js.name,
        tag: js.tag,
        situation: js.situation,
        days_since_contact: js.days_since_contact,
        flag_ready: js.flag_ready,
        flag_barrier: js.flag_barrier,
        score,
        band,
        roadmap: eap
          ? { goals: eap.goals, next_steps: eap.next_steps, stalled: eap.stalled }
          : null,
        // Surface today's actions so the model doesn't repeat them
        actions_taken_today: todayByClient.get(js.id) ?? [],
      }
    })
    .sort((a, b) => b.score - a.score)

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: AGENT_TOOLS,
    messages: [
      {
        role: 'user',
        content: `Here is your current ranked caseload. Please work through it now.\n\nIf a client already has entries in actions_taken_today, do NOT call the same tool again for them — move on.\n\n${JSON.stringify(rankedCaseload, null, 2)}`,
      },
    ],
  })

  let cycleSummary = ''
  const toolCalls: Array<{ name: string; input: Record<string, unknown> }> = []

  for (const block of response.content) {
    if (block.type === 'text' && !cycleSummary) {
      cycleSummary = block.text.split('\n')[0].trim()
    } else if (block.type === 'tool_use') {
      toolCalls.push({ name: block.name, input: block.input as Record<string, unknown> })
    }
  }

  const nameMap = new Map((jobseekers as Jobseeker[]).map((j) => [j.id, j.name]))
  const results = []

  for (const call of toolCalls) {
    const input = call.input
    const clientId = input.client_id as string

    // Hard dedup: skip if the same tool was already executed for this client today
    if (actedToday.has(`${clientId}:${call.name}`)) continue
    actedToday.add(`${clientId}:${call.name}`) // prevent within-cycle duplication too

    const confidence = input.confidence as number
    const rationale = (input.rationale as string) ?? ''
    const escalate = shouldEscalate(call.name, confidence)
    const status = escalate ? 'escalated' : 'auto'

    let outputId: string | null = null
    let outputTable: string | null = null

    if (!escalate) {
      if (call.name === 'create_case_note') {
        const { data } = await supabase
          .from('case_notes')
          .insert({ jobseeker_id: clientId, summary: input.summary as string, author: 'agent' })
          .select('id')
          .single()
        outputId = data?.id ?? null
        outputTable = 'case_notes'
      } else if (call.name === 'update_eap') {
        const { data } = await supabase
          .from('eaps')
          .update({ next_steps: input.next_steps, stalled: false })
          .eq('jobseeker_id', clientId)
          .select('id')
          .single()
        outputId = data?.id ?? null
        outputTable = 'eaps'
      } else if (call.name === 'refer_to_program') {
        const { data } = await supabase
          .from('referrals')
          .insert({
            jobseeker_id: clientId,
            program: input.program as string,
            reason: input.reason as string,
            author: 'agent',
          })
          .select('id')
          .single()
        outputId = data?.id ?? null
        outputTable = 'referrals'
      } else if (call.name === 'schedule_followup') {
        const daysFromNow = input.days_from_now as number
        const dueAt = new Date()
        dueAt.setDate(dueAt.getDate() + daysFromNow)
        const { data } = await supabase
          .from('followups')
          .insert({
            jobseeker_id: clientId,
            due_at: dueAt.toISOString(),
            purpose: input.purpose as string,
            author: 'agent',
          })
          .select('id')
          .single()
        outputId = data?.id ?? null
        outputTable = 'followups'
      } else if (call.name === 'draft_outreach') {
        const { data } = await supabase
          .from('outreach')
          .insert({
            jobseeker_id: clientId,
            channel: input.channel as string,
            message: input.message as string,
            author: 'agent',
          })
          .select('id')
          .single()
        outputId = data?.id ?? null
        outputTable = 'outreach'
      }
    }

    const { data: auditRow } = await supabase
      .from('agent_actions')
      .insert({
        jobseeker_id: clientId,
        tool: call.name,
        input,
        output_id: outputId,
        output_table: outputTable,
        confidence,
        status,
        rationale,
        cycle_summary: cycleSummary,
      })
      .select('id')
      .single()

    results.push({
      jobseekerId: clientId,
      jobseekerName: nameMap.get(clientId) ?? clientId,
      tool: call.name,
      input,
      confidence,
      status,
      rationale,
      agentActionId: auditRow?.id ?? '',
    })
  }

  return NextResponse.json({ cycleSummary, actions: results })
}
