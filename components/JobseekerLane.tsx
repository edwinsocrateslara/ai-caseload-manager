'use client'

import { useRef, useEffect } from 'react'
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

function PriorityBadge({ level }: { level: PriorityBand }) {
  const token = PRIORITY_TOKEN[level]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: 24, padding: '0 10px', borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xxs)', fontWeight: 600, lineHeight: 1,
      color: `var(${token})`,
      background: `color-mix(in oklab, var(${token}) 10%, transparent)`,
      border: `1px solid color-mix(in oklab, var(${token}) 38%, transparent)`,
    }}>
      {level}
    </span>
  )
}

export default function JobseekerLane({ jobseeker, onApprove, onOverride }: JobseekerLaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const nowRef    = useRef<HTMLDivElement>(null)
  const now       = new Date()
  const token     = PRIORITY_TOKEN[jobseeker.band]

  const pastEvents   = jobseeker.timeline.filter((e) => new Date(e.timestamp) <= now)
  const futureEvents = jobseeker.timeline.filter((e) => new Date(e.timestamp) > now)

  useEffect(() => {
    if (scrollRef.current && nowRef.current) {
      const cw = scrollRef.current.clientWidth
      scrollRef.current.scrollLeft = nowRef.current.offsetLeft - cw / 2
    }
  }, [jobseeker.timeline.length])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '178px 1fr' }}>

      {/* Identity column — left edge aligns with stats card (paddingLeft on section = 32px) */}
      <div style={{ padding: '24px 16px 32px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, flexShrink: 0, background: `var(${token})` }} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.2 }}>
            {jobseeker.name}
          </span>
        </div>
        {/* Tag (category) first, then triage badge */}
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)', paddingLeft: 16 }}>{jobseeker.tag}</div>
        <div style={{ paddingLeft: 16 }}><PriorityBadge level={jobseeker.band} /></div>
      </div>

      {/* Timeline track — DS: 4px grid → p: 24/24/32/0 */}
      <div
        ref={scrollRef}
        className="track"
        style={{ overflowX: 'auto', padding: '24px 24px 32px 0' }}
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
                  event.type === 'agent_action' && event.state !== 'skipped' && event.agentAction
                    ? () => onOverride(event.agentAction!.id)
                    : null
                }
              />
            ))}

            {/* NOW marker */}
            <div
              ref={nowRef}
              style={{
                width: 28, flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute', top: -16,
                fontSize: 'var(--text-xxxs)', fontWeight: 700, letterSpacing: '.08em',
                color: 'var(--primary)', fontFamily: 'var(--font-mono)',
              }}>
                NOW
              </div>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: 'var(--primary)', flexShrink: 0 }} />
              <div style={{
                width: 2, flex: 1, marginTop: 4,
                background: 'color-mix(in oklab, var(--primary) 40%, transparent)',
              }} />
            </div>

            {futureEvents.map((event) => (
              <TimelineNode
                key={event.id}
                event={event}
                onApprove={null}
                onOverride={
                  event.type === 'agent_action' && event.state !== 'skipped' && event.agentAction
                    ? () => onOverride(event.agentAction!.id)
                    : null
                }
              />
            ))}

            {futureEvents.length === 0 && (
              <span style={{
                alignSelf: 'center', paddingLeft: 8,
                fontSize: 'var(--text-xs)', fontStyle: 'italic',
                color: 'var(--border)',
              }}>
                no planned steps
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
