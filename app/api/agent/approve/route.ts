import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { actionId } = await req.json()
  if (!actionId) return NextResponse.json({ error: 'actionId required' }, { status: 400 })

  const supabase = createServerClient()

  const { data: action, error } = await supabase
    .from('agent_actions')
    .select('*')
    .eq('id', actionId)
    .single()

  if (error || !action) {
    return NextResponse.json({ error: 'Action not found' }, { status: 404 })
  }
  if (action.status !== 'escalated') {
    return NextResponse.json({ error: 'Action is not in escalated state' }, { status: 400 })
  }

  const input = action.input as Record<string, unknown>
  const clientId = action.jobseeker_id
  let outputId: string | null = null
  let outputTable: string | null = null

  if (action.tool === 'create_case_note') {
    const { data } = await supabase
      .from('case_notes')
      .insert({ jobseeker_id: clientId, summary: input.summary as string, author: 'agent' })
      .select('id')
      .single()
    outputId = data?.id ?? null
    outputTable = 'case_notes'
  } else if (action.tool === 'update_eap') {
    const { data } = await supabase
      .from('eaps')
      .update({ next_steps: input.next_steps, stalled: false })
      .eq('jobseeker_id', clientId)
      .select('id')
      .single()
    outputId = data?.id ?? null
    outputTable = 'eaps'
  } else if (action.tool === 'refer_to_program') {
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
  } else if (action.tool === 'schedule_followup') {
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
  } else if (action.tool === 'draft_outreach') {
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

  await supabase
    .from('agent_actions')
    .update({ status: 'approved', output_id: outputId, output_table: outputTable })
    .eq('id', actionId)

  return NextResponse.json({ ok: true })
}
