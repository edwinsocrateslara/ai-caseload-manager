'use client'

import { Check, X } from 'lucide-react'
import type { TimelineEvent } from '@/lib/types'

interface TimelineNodeProps {
  event: TimelineEvent
  onApprove: (() => void) | null
  onOverride: (() => void) | null
}

function formatRelative(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const days = Math.round(Math.abs(diffMs) / 86_400_000)
  if (days === 0) return 'TODAY'
  if (diffMs > 0) return `${days}D AGO`
  return `IN ${days}D`
}

function ActorTag({ actor }: { actor: string }) {
  const isYou = actor === 'human'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      height: 16, padding: '0 6px', borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xxxs)', fontWeight: 700, letterSpacing: '.05em',
      textTransform: 'uppercase' as const,
      color: isYou ? 'color-mix(in oklab, var(--primary) 80%, white)' : 'var(--chart-2)',
      background: isYou
        ? 'color-mix(in oklab, var(--primary) 22%, transparent)'
        : 'color-mix(in oklab, var(--chart-2) 18%, transparent)',
    }}>
      {isYou ? 'YOU' : 'AGENT'}
    </span>
  )
}

function NodeDot({ state }: { state: TimelineEvent['state'] }) {
  if (state === 'upcoming') {
    return (
      <span style={{
        width: 12, height: 12, borderRadius: 999, flexShrink: 0, boxSizing: 'border-box',
        background: 'var(--background)', border: '2px solid var(--primary)',
      }} />
    )
  }
  if (state === 'pending') {
    return (
      <span style={{
        width: 11, height: 11, borderRadius: 999, flexShrink: 0,
        background: 'var(--destructive)',
        boxShadow: '0 0 0 4px color-mix(in oklab, var(--destructive) 18%, var(--background))',
      }} />
    )
  }
  if (state === 'skipped') {
    return (
      <span style={{
        width: 11, height: 11, borderRadius: 999, flexShrink: 0,
        background: 'var(--border)',
      }} />
    )
  }
  return (
    <span style={{
      width: 11, height: 11, borderRadius: 999, flexShrink: 0,
      background: 'var(--chart-2)',
      boxShadow: '0 0 0 4px color-mix(in oklab, var(--chart-2) 18%, var(--background))',
    }} />
  )
}

export default function TimelineNode({ event, onApprove, onOverride }: TimelineNodeProps) {
  const isUpcoming = event.state === 'upcoming'
  const isPending  = event.state === 'pending'
  const isSkipped  = event.state === 'skipped'

  return (
    <div style={{ width: 248, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Dot on the hairline */}
      <div style={{ height: 11, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
        <NodeDot state={event.state} />
      </div>

      {/* Card — fixed height so all cards in a row are equal */}
      <div style={{
        height: 168, padding: 16,
        background: isUpcoming ? 'transparent' : 'var(--card)',
        border: `1px ${isUpcoming ? 'dashed' : 'solid'} ${isPending
          ? 'color-mix(in oklab, var(--destructive) 45%, transparent)'
          : 'var(--border)'}`,
        borderRadius: 'var(--radius-xl)',
        boxShadow: isUpcoming ? 'none' : isPending
          ? '0 0 0 1px color-mix(in oklab, var(--destructive) 12%, transparent)'
          : 'var(--shadow-sm)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Time + actor — DS: text-xxxs (10px) mono for time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
          <span style={{
            fontSize: 'var(--text-xxxs)', fontWeight: 600, letterSpacing: '.06em',
            color: 'var(--muted-foreground)', textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)',
          }}>
            {formatRelative(event.timestamp)}
          </span>
          <ActorTag actor={event.actor} />
        </div>

        {/* Title — DS: text-sm (16px) / 700 */}
        <div style={{
          marginTop: 8, fontSize: 'var(--text-sm)', fontWeight: 700, lineHeight: 1.25,
          color: isUpcoming
            ? 'color-mix(in oklab, var(--muted-foreground) 55%, var(--foreground))'
            : 'var(--foreground)',
          textDecoration: isSkipped ? 'line-through' : 'none',
          opacity: isSkipped ? 0.5 : 1,
        }}>
          {event.label}
        </div>

        {/* Body — DS: text-xs (14px) muted, 2-line clamp */}
        {event.detail && (
          <div className="clamp2" style={{
            marginTop: 4, fontSize: 'var(--text-xs)', lineHeight: 1.45,
            color: 'var(--muted-foreground)',
          }}>
            {event.detail}
          </div>
        )}

        {/* Actions — DS button sm: h-8 (32px) px-3, rounded-full */}
        {(onApprove || onOverride) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12 }}>
            {onApprove && (
              <button
                onClick={onApprove}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  height: 32, padding: '0 12px', borderRadius: 'var(--radius-full)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)', fontWeight: 500,
                  background: 'var(--chart-2)', border: '1px solid var(--chart-2)',
                  color: 'var(--background)',
                }}
              >
                <Check size={12} /> Approve
              </button>
            )}
            {onOverride && (
              <button
                onClick={onOverride}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  height: 32, padding: '0 12px', borderRadius: 'var(--radius-full)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)', fontWeight: 500,
                  background: 'transparent',
                  border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)',
                  color: 'var(--foreground)',
                }}
              >
                <X size={12} color="var(--muted-foreground)" /> Override
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
