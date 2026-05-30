import type { Evaluation, GameState, Rating } from './types'
import type { EvaluationTexts } from '../content/types'
import { evaluationTexts } from '../content/loader'

export function evaluate(state: GameState): Evaluation {
  const { stats, decisions, thresholds } = state
  const creditScore = normalizeCredits(stats.credits, thresholds)
  const secondaryAvg = (stats.energy + stats.hunger + stats.entertainment) / 3

  let totalSkips = 0
  let totalCourses = 0
  for (const d of decisions) {
    for (const a of d.courseActions) {
      if (a === 'skip') totalSkips++
      totalCourses++
    }
  }
  const skipRate = totalCourses > 0 ? totalSkips / totalCourses : 0

  const composite =
    creditScore * 0.35 +
    (stats.mood / 100) * 20 +
    (secondaryAvg / 100) * 20 +
    (stats.money / 100) * 5 +
    (stats.roommateFavor / 100) * 10 +
    (1 - skipRate) * 10

  let rating: Rating
  if (composite >= 85) rating = 'S'
  else if (composite >= 70) rating = 'A'
  else if (composite >= 50) rating = 'B'
  else if (composite >= 35) rating = 'C'
  else rating = 'D'

  const { title, comment } = matchTitle(rating, stats, skipRate, evaluationTexts)
  return { rating, title, comment }
}

function normalizeCredits(credits: number, t: GameState['thresholds']): number {
  if (credits >= t.tutorCredits) return 95
  if (credits >= t.passCredits + 10) return 75
  if (credits >= t.passCredits) return 55
  return 30
}

function matchTitle(
  rating: Rating,
  stats: GameState['stats'],
  skipRate: number,
  texts: EvaluationTexts,
): { title: string; comment: string } {
  const pool = texts.titlePool[rating]
  if (!pool || pool.length === 0) {
    return texts.fallback
  }

  // 全量 ctx：stats 所有字段 + skipRate
  const ctx: Record<string, number> = {
    credits: stats.credits,
    mood: stats.mood,
    energy: stats.energy,
    hunger: stats.hunger,
    entertainment: stats.entertainment,
    money: stats.money,
    roommateFavor: stats.roommateFavor,
    skipRate,
  }

  for (const candidate of pool) {
    if (evalCondition(candidate.condition, ctx)) {
      return { title: candidate.title, comment: candidate.comment }
    }
  }

  return texts.fallback
}

export function evaluateFailure(stats: GameState['stats'], texts: EvaluationTexts = evaluationTexts): Evaluation {
  if (stats.credits < 10) {
    return { rating: 'D', title: texts.failureLowCredits.title, comment: texts.failureLowCredits.comment }
  }
  return { rating: 'D', title: texts.failureHighCredits.title, comment: texts.failureHighCredits.comment }
}

// 条件求值器 — 与 events.ts 共用同一套 DSL
// 支持: >=, <=, >, <, ==, !=, and, or, 'default'
function evalCondition(expr: string, ctx: Record<string, number>): boolean {
  if (expr === 'default') return true
  if (!expr || expr.trim() === '') return false

  const orParts = expr.split(/\s+or\s+/)
  for (const part of orParts) {
    if (evalAnd(part.trim(), ctx)) return true
  }
  return false
}

function evalAnd(expr: string, ctx: Record<string, number>): boolean {
  const parts = expr.split(/\s+and\s+/)
  for (const part of parts) {
    if (!evalCompare(part.trim(), ctx)) return false
  }
  return true
}

function evalCompare(expr: string, ctx: Record<string, number>): boolean {
  const match = expr.match(/^(\w+)\s*(>=|<=|!=|==|>|<)\s*([\d.]+)$/)
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
