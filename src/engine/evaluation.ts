import type { Evaluation, GameState, Rating } from './types'
import type { EvaluationTexts } from '../content/types'
import { evaluationTexts } from '../content/loader'
import { parseCondition } from './conditionEval'

export function evaluate(state: GameState): Evaluation {
  const { stats, decisions, thresholds } = state
  const creditScore = normalizeCredits(stats.credits, thresholds)
  const secondaryAvg = (stats.energy + stats.hunger + stats.entertainment) / 3

  let totalSkips = 0
  let totalCourses = 0
  for (let day = 0; day < decisions.length; day++) {
    const d = decisions[day]
    const dayCourses = state.courses[day] ?? []
    for (let i = 0; i < d.courseActions.length; i++) {
      // 仅统计有课的时段
      if (!dayCourses[i]) continue
      if (d.courseActions[i] === 'skip') totalSkips++
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
    if (parseCondition(candidate.condition, ctx)) {
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
