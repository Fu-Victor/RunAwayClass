import type { Course, CourseAction, DawnAction, DifficultyConfig, PlayerStats, StatsDelta } from './types'
import {
  ATTEND_EFFECT, SKIP_EFFECT, SUB_FOR_OTHER_EFFECT,
  HIRE_SUB_COST, HIRE_SUB_RISK, DAWN_EFFECTS,
} from './constants'
import { chance, pick } from './random'
import { calcRollCallProb, checkRollCall } from './courseGen'

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
        desc = '你心情大好，上课效率爆表，甚至主动回答了问题！'
      } else if (stats.mood <= 30) {
        deltas.credits = Math.max(0, (deltas.credits ?? 0) - 1)
        desc = '人在教室魂在飞，一个字都没听进去。'
      } else {
        desc = '你老实坐在教室里，时间过得比树懒还慢。'
      }

      if (stats.energy <= 25 && chance(0.4)) {
        deltas.credits = (deltas.credits ?? 0) - 1
        flags.sleep = true
        desc += ' 然后你睡着了，老师忍住了没砸粉笔。'
      }
      if (stats.entertainment <= 25 && chance(0.35)) {
        deltas.credits = (deltas.credits ?? 0) - 1
        flags.phone = true
        desc += ' 实在无聊，你掏出手机刷了整节课。'
      }
      if (course.teacher.trait === 'roll_call_lover'
        && checkRollCall(calcRollCallProb(course, skipHistoryCount, config))) {
        flags.rollCall = true
        desc += ' 老师点名了——还好你在，淡定答了"到"。'
      }
      break

    case 'skip':
      applyEffect(deltas, SKIP_EFFECT, mult)
      if (checkRollCall(calcRollCallProb(course, skipHistoryCount, config))) {
        flags.rollCall = true
        deltas.credits = (deltas.credits ?? 0) - 3
        desc = '你翘课了，老师点名了。喜提一次"重点关注"。'
      } else {
        desc = pick([
          '你成功翘课，在宿舍床上度过了一段美好时光。',
          '你溜去食堂吃了顿好的，幸福感暴增。',
          '旷课一时爽，一直旷课一直爽。今天老师没点名。',
          '你躲在图书馆摸鱼，假装自己在学习。',
        ])
      }
      break

    case 'sub_for_other':
      applyEffect(deltas, SUB_FOR_OTHER_EFFECT, mult)
      desc = '替别人上了一节课，赚了笔外快。腰酸背痛但看着钱包鼓起来，值了。'
      if (course.teacher.trait === 'roll_call_lover' && chance(0.2)) {
        desc += ' 老师点到你替的人的名字，你硬着头皮答了"到"。'
      }
      break

    case 'hire_sub':
      deltas.money = -HIRE_SUB_COST
      if (chance(HIRE_SUB_RISK)) {
        flags.hireFail = true
        deltas.credits = -3
        desc = `花了 ¥${HIRE_SUB_COST} 找人代课，结果那人也翘了！！双重背叛，学分和钱都没了。`
      } else if (checkRollCall(calcRollCallProb(course, skipHistoryCount, config))) {
        desc = `花了 ¥${HIRE_SUB_COST}，代课小哥稳稳帮你答了"到"。钱花得值。`
      } else {
        desc = `花了 ¥${HIRE_SUB_COST} 找人代课，轻松混过一节课。钱包瘦了，人是自由的。`
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
  let desc = ''

  switch (action) {
    case 'sleep_early':
      desc = '十点就睡了，第二天醒来像是换了个人——精力充沛得能跑马拉松。'
      break
    case 'gaming':
      desc = '打到凌晨三点，段位升了两颗星，但身体在疯狂抗议。舍友在床上翻来覆去……'
      break
    case 'cram':
      desc = '通宵赶作业，deadline 是第一生产力。天亮时作业写完了，人也快完了。'
      break
    case 'go_out':
      desc = '出去浪了一晚上，快乐是真实的，钱包是空虚的。明天早八？那是明天的事。'
      deltas.roommateFavor = Math.random() > 0.5 ? 5 : -5
      break
    case 'normal_rest':
      desc = '平平无奇的一个夜晚，正常休息，没什么特别的事发生。'
      break
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
