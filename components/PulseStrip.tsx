import type { CaseloadMetrics } from '@/lib/types'

export default function PulseStrip({ metrics }: { metrics: CaseloadMetrics }) {
  const { total, critical, high, moderate, low, pendingEscalations, agentActionsToday } = metrics

  return (
    <div className="flex-none flex items-center gap-0 px-0 h-11 border-b border-[#352c1f] bg-[#211b12]/70 text-[#a3977f] overflow-x-auto">
      {/* Caseload health */}
      <div className="flex items-center gap-2 px-6 h-full border-r border-[#352c1f]">
        <span className="text-[10px] font-mono uppercase tracking-wider whitespace-nowrap">Caseload</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-semibold text-[#e2694a]">{critical}C</span>
          <span className="text-[#352c1f]">/</span>
          <span className="text-xs font-mono font-semibold text-[#eda53c]">{high}H</span>
          <span className="text-[#352c1f]">/</span>
          <span className="text-xs font-mono font-semibold text-[#8fae84]">{moderate}M</span>
          <span className="text-[#352c1f]">/</span>
          <span className="text-xs font-mono font-semibold text-[#a3977f]">{low}L</span>
        </div>
        <span className="text-[10px] font-mono whitespace-nowrap">of {total}</span>
      </div>

      {/* Agent tasks today */}
      <div className="flex items-center gap-2 px-6 h-full border-r border-[#352c1f]">
        <span className="text-[10px] font-mono uppercase tracking-wider whitespace-nowrap">Agent Tasks Today</span>
        <span className="text-sm font-mono font-semibold text-[#f2ece0]">{agentActionsToday}</span>
      </div>

      {/* Immediate attention */}
      <div className="flex items-center gap-2 px-6 h-full">
        <span className="text-[10px] font-mono uppercase tracking-wider whitespace-nowrap">Immediate Attention</span>
        <span
          className="text-sm font-mono font-semibold"
          style={{ color: pendingEscalations > 0 ? '#e2694a' : '#8fae84' }}
        >
          {pendingEscalations}
        </span>
        {pendingEscalations > 0 && (
          <span className="text-[9px] font-mono text-[#e2694a] whitespace-nowrap">pending escalation{pendingEscalations !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  )
}
