'use client'

import { useState, useEffect, useCallback, useRef, CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import {
  Check, X, Pause, Play, Loader2,
  FileText, ListChecks, ArrowRightCircle, CalendarClock, MessageSquare,
  ChevronDown, ArrowRight,
} from 'lucide-react'
import type { CaseloadResponse, TimelineEvent } from '@/lib/types'
import JobseekerLane from './JobseekerLane'

// ── Timeframe picker ──────────────────────────────────────────────────────────

const TIMEFRAMES = [
  ['today', 'Today'],
  ['week',  'This week'],
  ['month', 'This month'],
  ['year',  'This year'],
  ['all',   'All time'],
] as const
type Timeframe = typeof TIMEFRAMES[number][0]

function TimeframePicker({ value, onChange }: { value: Timeframe; onChange: (v: Timeframe) => void }) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const btnRef = useRef<HTMLButtonElement>(null)
  const label = TIMEFRAMES.find((t) => t[0] === value)?.[1] ?? 'Today'

  const handleOpen = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setMenuStyle({
        position: 'fixed',
        top: r.bottom + 6,
        right: window.innerWidth - r.right,
        zIndex: 9999,
      })
    }
    setOpen((o) => !o)
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          height: 26, padding: '0 10px', borderRadius: '624rem', cursor: 'pointer',
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--muted-foreground)',
          fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
          letterSpacing: '.06em', textTransform: 'uppercase',
        }}
      >
        {label} <ChevronDown size={13} color="var(--muted-foreground)" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div style={{
            ...menuStyle,
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)', padding: 4,
            display: 'flex', flexDirection: 'column', minWidth: 120,
            boxShadow: '0 10px 30px oklch(0 0 0 / 0.45)',
          }}>
            {TIMEFRAMES.map(([k, l]) => (
              <button
                key={k}
                onClick={() => { onChange(k as Timeframe); setOpen(false) }}
                style={{
                  textAlign: 'left', fontSize: 13, borderRadius: 'var(--radius-md)',
                  padding: '7px 10px', cursor: 'pointer',
                  border: 0, background: 'transparent',
                  color: k === value ? 'var(--primary)' : 'var(--muted-foreground)',
                  fontWeight: k === value ? 600 : 400,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// ── Eyebrow label ─────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 'var(--text-xxs)', fontWeight: 600, letterSpacing: '.09em',
      textTransform: 'uppercase' as const, color: 'var(--muted-foreground)',
    }}>
      {children}
    </div>
  )
}

function LinkAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
        color: 'var(--muted-foreground)',
        fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
        letterSpacing: '.07em', textTransform: 'uppercase',
      }}
    >
      {children}
      <ArrowRight size={14} color="var(--muted-foreground)" />
    </button>
  )
}

// ── Tool metadata (for modals) ────────────────────────────────────────────────

const TOOL_META = {
  create_case_note:  { label: 'Logged case note',        Icon: FileText },
  update_eap:        { label: 'Updated Roadmap',          Icon: ListChecks },
  refer_to_program:  { label: 'Service referral created', Icon: ArrowRightCircle },
  schedule_followup: { label: 'Scheduled follow-up',      Icon: CalendarClock },
  draft_outreach:    { label: 'Drafted outreach',         Icon: MessageSquare },
} as const

function actionLine(tool: string, input: Record<string, unknown>): string {
  switch (tool) {
    case 'create_case_note':  return (input.summary as string) ?? ''
    case 'update_eap':        return 'Next steps → ' + ((input.next_steps as string[]) ?? []).join(' · ')
    case 'refer_to_program':  return `${input.program} — ${input.reason}`
    case 'schedule_followup': return `In ${input.days_from_now}d — ${input.purpose}`
    case 'draft_outreach':    return `[${input.channel}] "${input.message}"`
    default: return ''
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ModalEvent extends TimelineEvent { jobseekerName: string }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SwimlanePage() {
  const [data,         setData]         = useState<CaseloadResponse | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [cycling,      setCycling]      = useState(false)
  const [agentsActive, setAgentsActive] = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [timeframe,    setTimeframe]    = useState<Timeframe>('today')
  const [taskCount,    setTaskCount]    = useState(0)
  const [viewing,      setViewing]      = useState<'handled' | 'attention' | null>(null)

  const cyclingRef     = useRef(false)
  const initialDoneRef = useRef(false)

  // ── Fetchers ────────────────────────────────────────────────────────────

  const fetchCaseload = useCallback(async () => {
    try {
      const res = await fetch('/api/caseload')
      if (!res.ok) throw new Error(`Failed to load caseload (${res.status})`)
      setData(await res.json())
      setError(null)
    } catch (e) { setError(e instanceof Error ? e.message : 'Unknown error') }
    finally { setLoading(false) }
  }, [])

  const fetchTaskCount = useCallback(async (tf: Timeframe) => {
    try {
      const res = await fetch(`/api/metrics?timeframe=${tf}`)
      if (res.ok) setTaskCount((await res.json()).count ?? 0)
    } catch { /* silent */ }
  }, [])

  // ── Cycle ───────────────────────────────────────────────────────────────

  const runCycle = useCallback(async () => {
    if (cyclingRef.current) return
    cyclingRef.current = true; setCycling(true)
    try {
      const res = await fetch('/api/agent/cycle', { method: 'POST' })
      if (!res.ok) throw new Error(`Cycle failed (${res.status})`)
      await fetchCaseload()
      await fetchTaskCount(timeframe)
    } catch (e) { setError(e instanceof Error ? e.message : 'Cycle error') }
    finally { cyclingRef.current = false; setCycling(false) }
  }, [fetchCaseload, fetchTaskCount, timeframe])

  // ── Mount ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchCaseload()
    fetchTaskCount('today')
    if (!initialDoneRef.current) { initialDoneRef.current = true; runCycle() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetchTaskCount(timeframe) }, [timeframe, fetchTaskCount])

  // ── Toggle ──────────────────────────────────────────────────────────────

  const toggleAgents = () => {
    if (agentsActive) { setAgentsActive(false) }
    else { setAgentsActive(true); runCycle() }
  }

  // ── Approve / Override ──────────────────────────────────────────────────

  const handleApprove = useCallback(async (actionId: string) => {
    await fetch('/api/agent/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actionId }) })
    await fetchCaseload(); await fetchTaskCount(timeframe)
  }, [fetchCaseload, fetchTaskCount, timeframe])

  const handleOverride = useCallback(async (actionId: string) => {
    await fetch('/api/agent/override', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actionId }) })
    await fetchCaseload(); await fetchTaskCount(timeframe)
  }, [fetchCaseload, fetchTaskCount, timeframe])

  // ── Derived ─────────────────────────────────────────────────────────────

  const avgScore = data
    ? data.jobseekers.reduce((s, js) => s + js.score, 0) / Math.max(1, data.jobseekers.length)
    : 0
  const health = Math.max(0, Math.min(100, Math.round(100 - avgScore)))

  const allAgentEvents: ModalEvent[] = (data?.jobseekers ?? []).flatMap((js) =>
    js.timeline.filter((e) => e.type === 'agent_action').map((e) => ({ ...e, jobseekerName: js.name }))
  )
  const handledEvents   = allAgentEvents.filter((e) => e.state === 'done')
  const escalatedEvents = allAgentEvents.filter((e) => e.state === 'pending')

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minWidth: 1280, fontFamily: 'var(--font-sans)' }}>

      {/* ── Header ── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '30px 32px 0',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'color-mix(in oklab, var(--background) 92%, transparent)',
        backdropFilter: 'blur(12px)',
      }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '.06em',
            textTransform: 'uppercase', color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)',
          }}>
            SERVICE ROUTING
          </h1>
          <div style={{
            marginTop: 4, fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)',
            fontFamily: 'var(--font-sans)',
          }}>
            Operator: John Doe · Supervising: 80 Jobseekers
          </div>
        </div>

        <button
          onClick={toggleAgents}
          disabled={cycling}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: 40, padding: '0 18px', borderRadius: '624rem', cursor: 'pointer',
            background: 'transparent', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xs)',
            color: 'var(--foreground)',
            fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
            opacity: cycling ? 0.6 : 1,
          }}
        >
          {cycling
            ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            : agentsActive ? <Pause size={16} /> : <Play size={16} />}
          {agentsActive ? 'Pause Agents' : 'Resume Agents'}
        </button>
      </header>

      {/* ── Stats strip — DS: bg-card border border-border rounded-2xl shadow-sm ── */}
      {data && (
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(360px,1fr) minmax(360px,1fr) minmax(320px,1fr)',
          margin: '32px 32px 0',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)',
          overflow: 'hidden', background: 'var(--card)', boxShadow: 'var(--shadow-sm)',
        }}>

          {/* 1. Task health */}
          <div style={{ padding: '24px 28px', borderRight: '1px solid var(--border)' }}>
            <div style={{ height: 24, display: 'flex', alignItems: 'center' }}>
              <Eyebrow>Task health</Eyebrow>
            </div>
            <div style={{
              fontSize: 40, fontWeight: 700, lineHeight: 1.1, marginTop: 8,
              color: 'var(--chart-2)', fontFamily: 'var(--font-mono)',
            }}>
              {health}%
            </div>
            <div style={{
              marginTop: 12, height: 4, borderRadius: 'var(--radius-full)',
              background: 'var(--border)', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', insetInlineStart: 0, top: 0, bottom: 0,
                width: `${health}%`, borderRadius: 'var(--radius-full)',
                background: 'linear-gradient(90deg, var(--destructive), var(--chart-3), var(--chart-2))',
                transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>

          {/* 2. Agent handled tasks */}
          <div style={{ padding: '24px 28px', borderRight: '1px solid var(--border)' }}>
            <div style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Eyebrow>Agent handled tasks</Eyebrow>
              <TimeframePicker value={timeframe} onChange={setTimeframe} />
            </div>
            <div style={{
              fontSize: 40, fontWeight: 700, lineHeight: 1.1, marginTop: 8,
              color: 'var(--foreground)', fontFamily: 'var(--font-mono)',
            }}>
              {taskCount.toLocaleString()}
            </div>
            <div style={{ marginTop: 12 }}>
              <LinkAction onClick={() => setViewing('handled')}>View tasks</LinkAction>
            </div>
          </div>

          {/* 3. Immediate attention */}
          <div style={{ padding: '24px 28px' }}>
            <div style={{ height: 24, display: 'flex', alignItems: 'center' }}>
              <Eyebrow>Immediate attention required</Eyebrow>
            </div>
            <div style={{
              fontSize: 40, fontWeight: 700, lineHeight: 1.1, marginTop: 8,
              color: escalatedEvents.length > 0 ? 'var(--destructive)' : 'var(--chart-2)',
              fontFamily: 'var(--font-mono)',
            }}>
              {escalatedEvents.length}
            </div>
            <div style={{ marginTop: 12 }}>
              <LinkAction onClick={() => setViewing('attention')}>View items</LinkAction>
            </div>
          </div>
        </section>
      )}

      {/* ── Loading / error ── */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--muted-foreground)', fontSize: 14 }}>
          Loading caseload…
        </div>
      )}
      {error && (
        <div style={{
          margin: '16px 32px 0', padding: '11px 14px', borderRadius: 'var(--radius-lg)',
          background: 'color-mix(in oklab, var(--destructive) 12%, transparent)',
          color: 'var(--destructive)', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* ── Jobseeker rows ── */}
      {data && !loading && (
        <section style={{ margin: '30px 0 56px', paddingLeft: 32 }}>
          {data.jobseekers.map((js) => (
            <JobseekerLane
              key={js.id}
              jobseeker={js}
              onApprove={handleApprove}
              onOverride={handleOverride}
            />
          ))}
        </section>
      )}

      {/* ── FF brand mark ── */}
      <div style={{
        position: 'fixed', left: 22, bottom: 22,
        width: 34, height: 34, borderRadius: 999,
        background: 'var(--primary)', color: 'var(--primary-foreground)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 14, boxShadow: 'var(--shadow-md)',
        fontFamily: 'var(--font-sans)',
      }}>
        FF
      </div>

      {/* ── Modals ── */}
      {viewing && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'oklch(0 0 0 / 0.62)', backdropFilter: 'blur(3px)',
            zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={() => setViewing(null)}
        >
          <div
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-2xl)',
              width: '100%', maxWidth: 560, maxHeight: '80vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 24px 70px oklch(0 0 0 / 0.55)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--foreground)' }}>
                  {viewing === 'handled' ? 'Agent-handled tasks' : 'Immediate attention required'}
                </div>
                <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
                  {viewing === 'handled'
                    ? `${handledEvents.length} this session`
                    : `${escalatedEvents.length} awaiting your decision`}
                </div>
              </div>
              <button
                onClick={() => setViewing(null)}
                style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 2, color: 'var(--muted-foreground)', display: 'grid', placeItems: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
              {(viewing === 'handled' ? handledEvents : escalatedEvents).length === 0 && (
                <div style={{ color: 'var(--muted-foreground)', fontSize: 13, textAlign: 'center', padding: '34px 10px' }}>
                  {viewing === 'handled' ? 'No tasks handled yet.' : 'Nothing needs your attention right now.'}
                </div>
              )}

              {(viewing === 'handled' ? handledEvents : escalatedEvents).map((evt) => {
                if (!evt.agentAction) return null
                const action = evt.agentAction
                const meta = TOOL_META[action.tool as keyof typeof TOOL_META]
                if (!meta) return null
                const { Icon } = meta
                return (
                  <div key={evt.id} style={{ display: 'flex', gap: 11, background: 'color-mix(in oklab, var(--foreground) 4%, transparent)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '12px 14px' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--muted-foreground)', flexShrink: 0, background: 'var(--secondary)' }}>
                      <Icon size={13} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--foreground)' }}>{meta.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{evt.jobseekerName}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'var(--font-sans)' }}>
                          {Math.round(action.confidence * 100)}%
                        </span>
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.45, marginTop: 6, color: 'var(--foreground)' }}>
                        {actionLine(action.tool, action.input)}
                      </div>
                      {action.rationale && (
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontStyle: 'italic', marginTop: 5 }}>
                          {action.rationale}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
                        {viewing === 'attention' && (
                          <button
                            onClick={() => handleApprove(action.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              height: 28, padding: '0 12px', borderRadius: '624rem', cursor: 'pointer',
                              background: 'var(--chart-2)', border: '1px solid var(--chart-2)',
                              color: 'var(--background)',
                              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                            }}
                          >
                            <Check size={13} /> Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleOverride(action.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            height: 28, padding: '0 12px', borderRadius: '624rem', cursor: 'pointer',
                            background: 'transparent', border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-xs)', color: 'var(--foreground)',
                            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                          }}
                        >
                          <X size={13} color="var(--muted-foreground)" /> Override
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
