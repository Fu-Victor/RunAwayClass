import type { Course, CourseAction, DawnAction, DifficultyConfig, FreeAction, PlayerStats, StatsDelta } from './types'
import {
  ATTEND_EFFECT, SKIP_EFFECT, SUB_FOR_OTHER_EFFECT,
  HIRE_SUB_EFFECT, HIRE_SUB_RISK, DAWN_EFFECTS,
  GO_OUT_ROOMMATE_DELTA, FREE_SLOT_EFFECTS,
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
        desc = actionTexts.attend.moodHigh
        add(deltas, 'credits', Math.round(2 * mult))
      } else if (stats.mood <= 30) {
        desc = actionTexts.attend.moodLow
        add(deltas, 'credits', -Math.round(1 * mult))
      } else {
        desc = actionTexts.attend.normal
      }

      if (stats.energy <= 25 && chance(0.4)) {
        flags.sleep = true
        add(deltas, 'credits', -Math.round(1 * mult))
        desc += actionTexts.attend.sleepSuffix
      }
      if (stats.entertainment <= 25 && chance(0.35)) {
        flags.phone = true
        add(deltas, 'credits', -Math.round(1 * mult))
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
        add(deltas, 'credits', -Math.round(3 * mult))
        desc = actionTexts.skip.rollCall
      } else {
        try {
          desc = pick(actionTexts.skip.successPool)
        } catch {
          desc = actionTexts.skip.fallback
        }
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
      applyEffect(deltas, HIRE_SUB_EFFECT, mult)
      if (chance(HIRE_SUB_RISK)) {
        flags.hireFail = true
        add(deltas, 'credits', -Math.round(3 * mult))
        desc = actionTexts.hireSub.fail.replace('{cost}', String(-HIRE_SUB_EFFECT.money))
      } else if (checkRollCall(calcRollCallProb(course, skipHistoryCount, config))) {
        desc = actionTexts.hireSub.rollCall.replace('{cost}', String(-HIRE_SUB_EFFECT.money))
      } else {
        desc = actionTexts.hireSub.safe.replace('{cost}', String(-HIRE_SUB_EFFECT.money))
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
  const deltas: StatsDelta = { ...DAWN_EFFECTS[action] }
  const texts = actionTexts.dawn
  let desc = ''

  switch (action) {
    case 'sleep_early': desc = texts.sleepEarly; break
    case 'gaming':      desc = texts.gaming; break
    case 'cram':        desc = texts.cram; break
    case 'go_out':
      desc = texts.goOut
      const prev = deltas.roommateFavor ?? 0
      deltas.roommateFavor = prev + (
        Math.random() > GO_OUT_ROOMMATE_DELTA.threshold
          ? GO_OUT_ROOMMATE_DELTA.positive
          : GO_OUT_ROOMMATE_DELTA.negative
      )
      break
    case 'normal_rest': desc = texts.normalRest; break
  }

  return { deltas, description: desc }
}

export function resolveFreeSlotAction(action: FreeAction): {
  deltas: StatsDelta
  description: string
} {
  const deltas = { ...FREE_SLOT_EFFECTS[action] }
  const desc = actionTexts.freeSlot[action]
  return { deltas, description: desc }
}

function add(deltas: StatsDelta, key: keyof StatsDelta, val: number): void {
  deltas[key] = (deltas[key] ?? 0) + val
}

function applyEffect(deltas: StatsDelta, effect: PlayerStats, multiplier: number): void {
  for (const key of Object.keys(effect) as (keyof PlayerStats)[]) {
    const val = effect[key]
    if (val !== 0) {
      add(deltas, key, Math.round(val * multiplier))
    }
  }
}
