export type PriorityBand = 'Critical' | 'High' | 'Moderate' | 'Low'

export interface Jobseeker {
  id: string
  name: string
  tag: string
  situation: string | null
  days_since_contact: number
  flag_ready: boolean
  flag_barrier: string | null
  assigned_counselor: string | null
  created_at: string
  updated_at: string
}

export interface EAP {
  id: string
  jobseeker_id: string
  goals: string[]
  next_steps: string[]
  stalled: boolean
  created_at: string
  updated_at: string
}

export interface CaseNote {
  id: string
  jobseeker_id: string
  summary: string
  author: string
  created_at: string
}

export interface Referral {
  id: string
  jobseeker_id: string
  program: string
  reason: string
  author: string
  created_at: string
}

export interface Followup {
  id: string
  jobseeker_id: string
  due_at: string
  purpose: string
  completed: boolean
  author: string
  created_at: string
}

export interface Outreach {
  id: string
  jobseeker_id: string
  channel: string
  message: string
  author: string
  created_at: string
}

export interface AgentAction {
  id: string
  jobseeker_id: string
  tool: string
  input: Record<string, unknown>
  output_id: string | null
  output_table: string | null
  confidence: number
  status: 'auto' | 'approved' | 'escalated' | 'overridden'
  rationale: string | null
  cycle_summary: string | null
  reversed_at: string | null
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  id: string
  type: 'case_note' | 'referral' | 'followup' | 'outreach' | 'agent_action'
  actor: 'agent' | 'human'
  state: 'done' | 'pending' | 'upcoming' | 'skipped'
  label: string
  detail: string
  timestamp: string
  agentAction?: AgentAction
}

export interface RankedJobseeker extends Jobseeker {
  eap: EAP | null
  score: number
  band: PriorityBand
  timeline: TimelineEvent[]
}

export interface CaseloadMetrics {
  total: number
  critical: number
  high: number
  moderate: number
  low: number
  pendingEscalations: number
  agentActionsToday: number
}

export interface CaseloadResponse {
  jobseekers: RankedJobseeker[]
  metrics: CaseloadMetrics
}

export interface CycleAction {
  jobseekerId: string
  jobseekerName: string
  tool: string
  input: Record<string, unknown>
  confidence: number
  status: 'auto' | 'escalated'
  rationale: string
  agentActionId: string
}

export interface CycleResponse {
  cycleSummary: string
  actions: CycleAction[]
}
