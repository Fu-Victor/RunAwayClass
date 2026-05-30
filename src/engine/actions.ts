import type { Course, CourseAction, DawnAction, DifficultyConfig, PlayerStats, StatsDelta } from './types'
import {
  ATTEND_EFFECT, SKIP_EFFECT, SUB_FOR_OTHER_EFFECT,
  HIRE_SUB_COST, HIRE_SUB_RISK, DAWN_EFFECTS,
} from './constants'
import { chance, pick } from './random'
import { calcRollCallProb, checkRollCall } from './courseGen'
import { actionTexts } from '../content/loader'

export interface ActionResult {
  deltas: StatsDelta
  description: string
  triggeredRollCall: boolean
  triggeredSleep: boolean
  triggeredPhone: boolean
  hireSubFailed: boolean
}

export function resolveCourseAction(
  action: CourseAction,
  course: Course,
  stats: PlayerStats,
  skipHistoryCount: number,
  config: DifficultyConfig,
): ActionResult {
  const mult = config.rewardMultiplier
  const deltas: StatsDelta = {}
  const flags = { rollCall: false, sleep: false, phone: false, hireFail: false }
  let desc = ''

  switch (action) {
    case 'attend':
      applyEffect(deltas, ATTEND_EFFECT, mult)
      if (stats.mood >= 70) {
        deltas.credits = (deltas.credits ?? 0) + Math.round(2 * mult)
        desc = actionTexts.attend.moodHigh
      } else if (stats.mood <= 30) {
        deltas.credits = Math.max(0, (deltas.credits ?? 0) - 1)
        desc = actionTexts.attend.moodLow
      } else {
        desc = actionTexts.attend.normal
      }

      if (stats.energy <= 25 && chance(0.4)) {
        deltas.credits = (deltas.credits ?? 0) - 1
        flags.sleep = true
        desc += actionTexts.attend.sleepSuffix
      }
      if (stats.entertainment <= 25 && chance(0.35)) {
        deltas.credits = (deltas.credits ?? 0) - 1
        flags.phone = true
        desc += actionTexts.attend.phoneSuffix
      }
      if (course.teacher.trait === 'roll_call_lover'
        && checkRollCall(calcRollCallProb(course, skipHistoryCount, config))) {
        flags.rollCall = true
        desc += actionTexts.attend.rollCallSuffix
      }
      break

    case 'skip':
      applyEffect(deltas, SKIP_EFFECT, mult)
      if (checkRollCall(calcRollCallProb(course, skipHistoryCount, config))) {
        flags.rollCall = true
        deltas.credits = (deltas.credits ?? 0) - 3
        desc = actionTexts.skip.rollCall
      } else {
        desc = pick(actionTexts.skip.successPool)
      }
      break

    case 'sub_for_other':
      applyEffect(deltas, SUB_FOR_OTHER_EFFECT, mult)
      desc = actionTexts.subForOther.main
      if (course.teacher.trait === 'roll_call_lover' && chance(0.2)) {
        desc += actionTexts.subForOther.rollCallSuffix
      }
      break

    case 'hire_sub':
      deltas.money = -HIRE_SUB_COST
      if (chance(HIRE_SUB_RISK)) {
        flags.hireFail = true
        deltas.credits = -3
        desc = actionTexts.hireSub.fail.replace('{cost}', String(HIRE_SUB_COST))
      } else if (checkRollCall(calcRollCallProb(course, skipHistoryCount, config))) {
        desc = actionTexts.hireSub.rollCall.replace('{cost}', String(HIRE_SUB_COST))
      } else {
        desc = actionTexts.hireSub.safe.replace('{cost}', String(HIRE_SUB_COST))
      }
      break
  }

  return {
    deltas,
    description: desc,
    triggeredRollCall: flags.rollCall,
    triggeredSleep: flags.sleep,
    triggeredPhone: flags.phone,
    hireSubFailed: flags.hireFail,
  }
}

export function resolveDawnAction(action: DawnAction): {
  deltas: StatsDelta
  description: string
} {
  const deltas = { ...DAWN_EFFECTS[action] }
  const texts = actionTexts.dawn
  let desc = ''

  switch (action) {
    case 'sleep_early': desc = texts.sleepEarly; break
    case 'gaming':      desc = texts.gaming; break
    case 'cram':        desc = texts.cram; break
    case 'go_out':
      desc = texts.goOut
      deltas.roommateFavor = Math.random() > 0.5 ? 5 : -5
      break
    case 'normal_rest': desc = texts.normalRest; break
  }

  return { deltas, description: desc }
}

function applyEffect(deltas: StatsDelta, effect: PlayerStats, multiplier: number): void {
  for (const key of Object.keys(effect) as (keyof PlayerStats)[]) {
    const val = effect[key]
    if (val !== 0) {
      deltas[key] = (deltas[key] ?? 0) + Math.round(val * multiplier)
    }
  }
}
