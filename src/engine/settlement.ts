import type { GameState, PlayerStats, StatsDelta } from './types'
import { DAILY_DECAY, STAT_MAX, STAT_MIN } from './constants'
import { settlementTexts } from '../content/loader'
import { clamp } from './random'

export interface SettlementResult {
  deltas: StatsDelta
  // 由精力/饱腹/娱乐均值与期望值比较产生的心情变动
  moodDeltaFromAvg: number
  warningTriggered: boolean
  gameOver: boolean
  description: string
}

export function settleDay(state: GameState): SettlementResult {
  const { stats, pendingDeltas, thresholds } = state
  const total: StatsDelta = { ...pendingDeltas }

  for (const key of Object.keys(DAILY_DECAY) as (keyof PlayerStats)[]) {
    total[key] = (total[key] ?? 0) + DAILY_DECAY[key]
  }

  const secondaryAvg = getSecondaryAvg(stats)
  const moodDeltaFromAvg = Math.round((secondaryAvg - thresholds.expectedAvg) / 10)
  total.mood = (total.mood ?? 0) + moodDeltaFromAvg

  let desc: string
  if (moodDeltaFromAvg > 3) {
    desc = settlementTexts.moodGood
  } else if (moodDeltaFromAvg < -3) {
    desc = settlementTexts.moodBad
  } else {
    desc = settlementTexts.moodNormal
  }

  const newCredits = stats.credits + (total.credits ?? 0)
  const warningTriggered = newCredits < thresholds.warningCredits
  if (warningTriggered) {
    desc += settlementTexts.creditWarning
  }

  const newMood = stats.mood + (total.mood ?? 0)
  const gameOver = newMood <= thresholds.crashMood

  return { deltas: total, moodDeltaFromAvg, warningTriggered, gameOver, description: desc }
}

export function applyDeltas(stats: PlayerStats, deltas: StatsDelta): PlayerStats {
  const result = { ...stats }
  for (const key of Object.keys(deltas) as (keyof PlayerStats)[]) {
    const delta = deltas[key] ?? 0
    result[key] = clamp(result[key] + delta, STAT_MIN[key], STAT_MAX[key])
  }
  return result
}

export function getSecondaryAvg(stats: PlayerStats): number {
  return (stats.energy + stats.hunger + stats.entertainment) / 3
}
