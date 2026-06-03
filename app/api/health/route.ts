import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    supabase_url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    service_role_set: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    anon_key_set:     !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anthropic_key_set:!!process.env.ANTHROPIC_API_KEY,
    node_version: process.version,
  })
}
