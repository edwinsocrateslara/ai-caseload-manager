'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PriorityBand, RankedJobseeker } from '@/lib/types'
import TimelineNode from './TimelineNode'

interface JobseekerLaneProps {
  jobseeker: RankedJobseeker
  onApprove: (actionId: string) => void
  onOverride: (actionId: string) => void
}

const PRIORITY_TOKEN: Record<PriorityBand, string> = {
  Critical: '--destructive',
  High:     '--chart-3',
  Moderate: '--chart-3',
  Low:      '--chart-2',
}

const SCROLL_BY = 272 // one card (248) + one gap (24)

export default function JobseekerLane({ jobseeker, onApprove, onOverride }: JobseekerLaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const nowRef    = useRef<HTMLDivElement>(null)
  const now       = new Date()
  const token     = PRIORITY_TOKEN[jobseeker.band]

  const [atStart, setAtStart] = useState(true)
  const [atEnd,   setAtEnd]   = useState(false)

  const pastEvents   = jobseeker.timeline.filter((e) => new Date(e.timestamp) <= now)
  const futureEvents = jobseeker.timeline.filter((e) => new Date(e.timestamp) > now)

  // Update arrow dim-state on scroll or resize
  const syncEdges = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 0)
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 2)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', syncEdges, { passive: true })
    const ro = new ResizeObserver(syncEdges)
    ro.observe(el)
    syncEdges()
    return () => { el.removeEventListener('scroll', syncEdges); ro.disconnect() }
  }, [syncEdges])

  // Centre NOW on mount / timeline change, then re-sync edges
  useEffect(() => {
    if (scrollRef.current && nowRef.current) {
      const cw = scrollRef.current.clientWidth
      scrollRef.current.scrollLeft = nowRef.current.offsetLeft - cw / 2
    }
    syncEdges()
  }, [jobseeker.timeline.length, syncEdges])

  const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -SCROLL_BY, behavior: 'smooth' })
  const scrollRight = () => scrollRef.current?.scrollBy({ left:  SCROLL_BY, behavior: 'smooth' })

  // Shared arrow style
  const arrowBtn = (disabled: boolean): React.CSSProperties => ({
    position: 'absolute', top: 131, transform: 'translateY(-50%)',
    zIndex: 3,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 'var(--radius-full)',
    background: 'var(--card)', border: '1px solid var(--border)',
    cursor: disabled ? 'default' : 'pointer',
    color: 'var(--foreground)',
    opacity: disabled ? 0.2 : 1,
    transition: 'opacity 0.15s',
    padding: 0,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 24, paddingBottom: 32 }}>

      {/* Lane header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: `var(${token})` }} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2 }}>
            {jobseeker.name}
          </span>
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', paddingLeft: 16 }}>
          {jobseeker.tag}
        </div>
      </div>

      {/* Timeline wrapper — relative so arrows and fade can anchor to it */}
      <div style={{ position: 'relative' }}>

        {/* Left arrow */}
        <button onClick={scrollLeft} disabled={atStart} style={{ ...arrowBtn(atStart), left: 0 }} aria-label="Scroll left">
          <ChevronLeft size={14} />
        </button>

        {/* Scrollable track */}
        <div
          ref={scrollRef}
          className="track"
          style={{ overflowX: 'auto', paddingTop: 20, paddingBottom: 8, paddingLeft: 36, paddingRight: 36 }}
        >
          <div style={{ position: 'relative', display: 'inline-flex', minWidth: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 24, position: 'relative' }}>

              {pastEvents.map((event) => (
                <TimelineNode
                  key={event.id}
                  event={event}
                  onApprove={
                    event.type === 'agent_action' && event.state === 'pending' && event.agentAction
                      ? () => onApprove(event.agentAction!.id)
                      : null
                  }
                  onOverride={
                    event.type === 'agent_action' && event.state === 'pending' && event.agentAction
                      ? () => onOverride(event.agentAction!.id)
                      : null
                  }
                />
              ))}

              {/* NOW marker */}
              <div
                ref={nowRef}
                style={{ width: 28, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
              >
                <div style={{
                  position: 'absolute', top: -16,
                  fontSize: 'var(--text-xxxs)', fontWeight: 700, letterSpacing: '.08em',
                  color: 'var(--primary)', fontFamily: 'var(--font-mono)',
                }}>
                  NOW
                </div>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: 'var(--primary)', flexShrink: 0 }} />
                <div style={{ width: 2, flex: 1, marginTop: 4, background: 'color-mix(in oklab, var(--primary) 40%, transparent)' }} />
              </div>

              {futureEvents.map((event) => (
                <TimelineNode
                  key={event.id}
                  event={event}
                  onApprove={null}
                  onOverride={
                    event.type === 'agent_action' && event.state === 'pending' && event.agentAction
                      ? () => onOverride(event.agentAction!.id)
                      : null
                  }
                />
              ))}

              {futureEvents.length === 0 && (
                <span style={{ alignSelf: 'center', paddingLeft: 8, fontSize: 'var(--text-xs)', fontStyle: 'italic', color: 'var(--border)' }}>
                  no planned steps
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right fade — sits above content, below arrow */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 348,
          background: 'linear-gradient(to right, transparent, var(--background))',
          pointerEvents: 'none', zIndex: 2,
        }} />

        {/* Right arrow */}
        <button onClick={scrollRight} disabled={atEnd} style={{ ...arrowBtn(atEnd), right: 0 }} aria-label="Scroll right">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
