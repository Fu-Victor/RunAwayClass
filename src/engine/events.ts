import type { GameEvent, GameState, StatsDelta } from './types'
import { chance, pick } from './random'
import { evalCondition } from './conditionEval'

export function findEligibleEvents(
  pool: readonly GameEvent[],
  state: GameState,
  phase: 'dawn' | 'course_break',
): GameEvent[] {
  return pool.filter(e =>
    e.phase === phase
    && !state.usedEventIds.includes(e.id)
    && evalCondition(e.condition, buildTriggerCtx(state)),
  )
}

export function tryTriggerEvent(
  eligible: GameEvent[],
  baseChance = 0.35,
  bias = 0,
): GameEvent | null {
  if (eligible.length === 0) return null
  const actualChance = Math.max(0, Math.min(1, baseChance + bias))
  if (!chance(actualChance)) return null
  return pick(eligible)
}

export function resolveEventOption(
  event: GameEvent,
  optionIndex: number,
): { deltas: StatsDelta; flavorText: string } {
  if (optionIndex < 0 || optionIndex >= event.options.length) {
    throw new Error(`resolveEventOption: index ${optionIndex} out of range for event ${event.id}`)
  }
  const opt = event.options[optionIndex]
  return { deltas: { ...opt.effects }, flavorText: opt.flavorText }
}

function buildTriggerCtx(state: GameState): Record<string, string | number> {
  const { stats, day, courseIndex, currentDecision } = state
  const course = state.courses[day - 1]?.[courseIndex]
  const action = course != null ? currentDecision?.courseActions[courseIndex] : undefined

  return {
    action: action ?? '',
    trait: course?.teacher.trait ?? '',
    special: course?.teacher.special ?? '',
    credits: stats.credits,
    mood: stats.mood,
    money: stats.money,
    roommateFavor: stats.roommateFavor,
    skipRate: state.totalSkipCount / Math.max(1, state.decisions.length * 9),
    courseType: course?.type ?? '',
  }
}
