import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const timeframe = req.nextUrl.searchParams.get('timeframe') ?? 'today'
  const supabase = createServerClient()

  const now = new Date()
  let since: Date | null = null

  if (timeframe === 'today') {
    since = new Date(now)
    since.setHours(0, 0, 0, 0)
  } else if (timeframe === 'week') {
    since = new Date(now)
    since.setDate(now.getDate() - 7)
  } else if (timeframe === 'month') {
    since = new Date(now)
    since.setMonth(now.getMonth() - 1)
  } else if (timeframe === 'year') {
    since = new Date(now)
    since.setFullYear(now.getFullYear() - 1)
  }
  // 'all' → since = null

  let query = supabase
    .from('agent_actions')
    .select('*', { count: 'exact', head: true })
    .in('status', ['auto', 'approved'])

  if (since) {
    query = query.gte('created_at', since.toISOString())
  }

  const { count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ count: count ?? 0 })
}
