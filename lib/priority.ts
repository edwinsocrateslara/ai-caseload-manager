import type { EAP, Jobseeker, PriorityBand } from './types'

export function computeScore(js: Jobseeker, eap: EAP | null): number {
  let score = 0
  if (!eap) {
    score += 40
  } else if (eap.stalled) {
    score += 25
  }
  score += Math.min(js.days_since_contact, 40) * 1.2
  if (js.flag_ready) score += 25
  return Math.round(score * 10) / 10
}

export function scoreToBand(score: number): PriorityBand {
  if (score >= 70) return 'Critical'
  if (score >= 45) return 'High'
  if (score >= 20) return 'Moderate'
  return 'Low'
}
