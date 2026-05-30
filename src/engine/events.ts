import type { GameEvent, GameState, StatsDelta } from './types'
import { chance, pick } from './random'

export function findEligibleEvents(
  pool: readonly GameEvent[],
  state: GameState,
  phase: 'dawn' | 'course_break',
): GameEvent[] {
  return pool.filter(e =>
    e.phase === phase && !state.usedEventIds.has(e.id) && checkTrigger(e, state),
  )
}

export function tryTriggerEvent(eligible: GameEvent[], baseChance = 0.35): GameEvent | null {
  if (eligible.length === 0 || !chance(baseChance)) return null
  return pick(eligible)
}

export function resolveEventOption(
  event: GameEvent,
  optionIndex: number,
): { deltas: StatsDelta; flavorText: string } {
  const opt = event.options[optionIndex]
  return { deltas: { ...opt.effects }, flavorText: opt.flavorText }
}

function checkTrigger(event: GameEvent, state: GameState): boolean {
  const { stats, courses, day, courseIndex, currentDecision } = state
  const id = event.id
  const course = courses[day - 1]?.[courseIndex]
  const action = course != null ? currentDecision?.courseActions[courseIndex] : undefined

  if (id.startsWith('roll_call_crisis')) {
    return action === 'skip' && (course?.teacher.trait === 'roll_call_lover')
  }
  if (id.startsWith('class_quiz')) {
    return action === 'attend' && course?.teacher.special === 'quiz_master'
  }
  if (id.startsWith('social_invite')) {
    return stats.roommateFavor >= 40
  }
  if (id.startsWith('roommate_rage')) {
    return currentDecision?.dawnAction === 'gaming' && stats.roommateFavor <= 40
  }
  if (id.startsWith('late_emo')) {
    return stats.mood <= 35 && currentDecision?.dawnAction !== 'sleep_early'
  }
  if (id.startsWith('surprise_quiz')) {
    return course?.type === 'serious' && stats.credits < 20
  }
  if (id.startsWith('early_bird')) {
    return currentDecision?.dawnAction === 'sleep_early'
  }
  if (id.startsWith('random_')) {
    return true
  }
  return false
}
