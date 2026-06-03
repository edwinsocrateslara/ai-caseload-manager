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
  if (action.status === 'overridden') {
    return NextResponse.json({ error: 'Already overridden' }, { status: 400 })
  }

  // If the action was auto-executed and wrote an output row, delete it
  if (action.output_id && action.output_table) {
    await supabase.from(action.output_table).delete().eq('id', action.output_id)
  }

  await supabase
    .from('agent_actions')
    .update({ status: 'overridden', reversed_at: new Date().toISOString() })
    .eq('id', actionId)

  return NextResponse.json({ ok: true })
}
