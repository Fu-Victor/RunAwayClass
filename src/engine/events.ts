import type { GameEvent, GameState, StatsDelta } from './types'
import { chance, pick } from './random'

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

// 条件表达式解析 — 与 evaluation.ts 共用同一套 DSL
// 支持: >=, <=, >, <, ==, !=, and, or, 'default'
function evalCondition(expr: string, ctx: Record<string, string | number>): boolean {
  if (expr === 'default') return true
  if (!expr || expr.trim() === '') return false

  const orParts = expr.split(/\s+or\s+/)
  for (const part of orParts) {
    if (evalAnd(part.trim(), ctx)) return true
  }
  return false
}

function evalAnd(expr: string, ctx: Record<string, string | number>): boolean {
  const parts = expr.split(/\s+and\s+/)
  for (const part of parts) {
    if (!evalCompare(part.trim(), ctx)) return false
  }
  return true
}

function evalCompare(expr: string, ctx: Record<string, string | number>): boolean {
  // 支持引号包裹的字符串值: key == 'value'
  const match = expr.match(/^(\w+)\s*(>=|<=|!=|==|>|<)\s*'?([^']*)'?$/)
  if (!match) {
    console.warn(`[evalCondition] invalid expression: "${expr}"`)
    return false
  }
  const [, key, op, valStr] = match
  const a = ctx[key]
  if (a === undefined) {
    console.warn(`[evalCondition] unknown variable: "${key}" in "${expr}"`)
    return false
  }

  // 字符串比较
  if (typeof a === 'string') {
    switch (op) {
      case '==': return a === valStr
      case '!=': return a !== valStr
      default:
        console.warn(`[evalCondition] operator "${op}" not supported for strings in "${expr}"`)
        return false
    }
  }

  // 数字比较
  const b = parseFloat(valStr)
  if (isNaN(b)) return false
  switch (op) {
    case '>=': return a >= b
    case '<=': return a <= b
    case '>':  return a > b
    case '<':  return a < b
    case '==': return a === b
    case '!=': return a !== b
    default:   return false
  }
}
