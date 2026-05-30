# 《逃课模拟器》后端开发文档

> **执行者：后端 ×2** | **预估总工时：~6h**
>
> **核心原则：** `src/engine/` 和 `src/content/` 中所有代码零 React 依赖。纯 TS 实现，可脱离浏览器用 Node 跑测试。

---

## 分工建议

| 后端 A | 后端 B |
|--------|--------|
| types, constants, random, courseGen, actions | events, settlement, evaluation, gameLoop, state, content/* |
| 算法核心、数值设计、行为结算 | 事件系统、评价系统、文案池 |

**两人在 BE-1 完成后必须一起过一遍 `types.ts` 和 `constants.ts`，确认所有接口对齐。**

---

## 文件结构

```
src/
├── engine/                    # 纯 TS 游戏逻辑（零 React 依赖）
│   ├── types.ts               #   所有类型定义（全项目基石）
│   ├── constants.ts           #   常量（阈值、难度配置、行为数值表）
│   ├── state.ts               #   初始状态工厂 + 深拷贝
│   ├── random.ts              #   随机工具函数（chance/pick/shuffle/weightedPick）
│   ├── courseGen.ts           #   课程与老师随机生成 + 点名概率
│   ├── actions.ts             #   玩家行为效果（4种课程行为 + 5种凌晨行为）
│   ├── events.ts              #   事件匹配、触发判定、选项结算
│   ├── settlement.ts          #   每日结算、心情联动、阈值检测
│   ├── evaluation.ts          #   通关/失败判定、多维修结算评价
│   └── gameLoop.ts            #   状态机流转（phase 转换规则）
│
└── content/                   # 随机文案池（纯数据，策划可直接改）
    ├── courseNames.ts         #   课名池 ~34 条
    ├── teacherNames.ts        #   老师名池 ~20 条
    ├── eventTexts.ts          #   事件文案池（含选项/效果/触发条件）
    ├── feedbackTexts.ts       #   数值区间反馈文案
    └── evaluationTexts.ts     #   评级称号、结算评语
```

---

## 任务列表

### BE-1: 类型定义 `src/engine/types.ts`

> ⚠️ **此文件为全项目基石，前后端共用。必须先写，双方对齐后再各自开工。**

```ts
// ==================== 玩家数值 ====================

export interface PlayerStats {
  credits: number        // 学分
  mood: number           // 心情
  energy: number         // 精力
  hunger: number         // 饱腹
  entertainment: number  // 娱乐
  money: number          // 金钱
  roommateFavor: number  // 舍友好感度
}

export type StatsDelta = Partial<PlayerStats>

// ==================== 阈值 ====================

export interface Thresholds {
  passCredits: number     // 通关值 — 第7天结算时 credits 需 >= 此值
  warningCredits: number  // 预警值 — 低于此值时弹警告
  tutorCredits: number    // 家教值 — 高于此值时解锁家教行为
  crashMood: number       // 崩溃值 — mood <= 此值直接失败
  expectedAvg: number     // 精力/饱腹/娱乐期望值 — 低于则扣心情
}

// ==================== 难度 ====================

export type Difficulty = 'easy' | 'normal' | 'hard'

export interface DifficultyConfig {
  initialStats: PlayerStats
  courseSeriousRatio: number   // 正课比例 0-1
  rollCallBias: number         // 点名概率偏移 -0.3 ~ +0.3
  eventPositiveBias: number    // 正面事件偏移 -0.3 ~ +0.3
  expectedAvg: number          // 期望值
  rewardMultiplier: number     // 行为收益倍率
}

// ==================== 课程与老师 ====================

export type CourseType = 'easy' | 'serious'

export type TeacherTrait = 'roll_call_lover' | 'roll_call_hater'

export type TeacherSpecial =
  | 'quiz_master'         // 随机提问狂魔
  | 'scripture_master'    // 课件念经大师
  | 'handwriting_only'    // 签到只认手写
  | null

export interface Teacher {
  name: string
  trait: TeacherTrait
  special: TeacherSpecial
}

export interface Course {
  id: string
  name: string
  type: CourseType
  teacher: Teacher
  timeSlotIndex: number   // 0-8
  estimatedRollCallProb: 'low' | 'medium' | 'high' | 'very_high'
}

// ==================== 时间 ====================

export const TIME_SLOTS = [
  '8:00-9:40', '9:50-11:30', '11:40-13:20',
  '13:30-15:10', '15:20-17:00', '17:10-18:50',
  '19:00-20:40', '20:50-22:20', '22:30-23:59'
] as const

// ==================== 玩家决策 ====================

export type CourseAction = 'attend' | 'skip' | 'sub_for_other' | 'hire_sub'

export type DawnAction = 'sleep_early' | 'gaming' | 'cram' | 'go_out' | 'normal_rest'

export interface DayDecision {
  courseActions: CourseAction[]  // length === 9
  dawnAction: DawnAction
}

// ==================== 事件 ====================

export interface EventOption {
  text: string
  effects: StatsDelta
  flavorText: string
}

export interface GameEvent {
  id: string
  phase: 'dawn' | 'course_break'
  triggerCondition: string
  title: string
  description: string
  options: EventOption[]    // 2-3 个
}

// ==================== 游戏阶段 ====================

export type GamePhase =
  | 'START'
  | 'NIGHT_DECISION'
  | 'DAWN'
  | 'DAWN_EVENT'
  | 'DAY_PROGRESSION'
  | 'EVENT'
  | 'DAY_SETTLEMENT'
  | 'GAME_OVER'
  | 'GAME_WIN'

// ==================== 历史记录 ====================

export interface HistoryEntry {
  day: number
  time: string
  description: string
  deltas: StatsDelta
}

// ==================== 结算评价 ====================

export type Rating = 'S' | 'A' | 'B' | 'C' | 'D'

export interface Evaluation {
  rating: Rating
  title: string
  comment: string
}

// ==================== 游戏全局状态 ====================

export interface GameState {
  phase: GamePhase
  day: number                 // 1-7
  courseIndex: number         // 0-8
  stats: PlayerStats
  thresholds: Thresholds
  difficulty: Difficulty
  difficultyConfig: DifficultyConfig
  courses: Course[][]         // [day][courseIndex], 7×9
  decisions: DayDecision[]
  currentDecision: DayDecision | null
  activeEvent: GameEvent | null
  history: HistoryEntry[]
  pendingDeltas: StatsDelta
  usedEventIds: Set<string>
  showWarning: boolean
}
```

---

### BE-2: 常量与难度配置 `src/engine/constants.ts`

```ts
import type { Difficulty, DifficultyConfig, PlayerStats, Thresholds } from './types'

export const DEFAULT_THRESHOLDS: Record<Difficulty, Thresholds> = {
  easy:   { passCredits: 30, warningCredits: 40, tutorCredits: 60, crashMood: 0, expectedAvg: 40 },
  normal: { passCredits: 45, warningCredits: 55, tutorCredits: 70, crashMood: 0, expectedAvg: 50 },
  hard:   { passCredits: 60, warningCredits: 70, tutorCredits: 85, crashMood: 0, expectedAvg: 60 }
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    initialStats: { credits: 10, mood: 80, energy: 80, hunger: 80, entertainment: 80, money: 30, roommateFavor: 60 },
    courseSeriousRatio: 0.3, rollCallBias: -0.15, eventPositiveBias: 0.15, expectedAvg: 40, rewardMultiplier: 1.3
  },
  normal: {
    initialStats: { credits: 5, mood: 65, energy: 65, hunger: 65, entertainment: 65, money: 15, roommateFavor: 40 },
    courseSeriousRatio: 0.5, rollCallBias: 0, eventPositiveBias: 0, expectedAvg: 50, rewardMultiplier: 1.0
  },
  hard: {
    initialStats: { credits: 0, mood: 50, energy: 50, hunger: 50, entertainment: 50, money: 5, roommateFavor: 20 },
    courseSeriousRatio: 0.7, rollCallBias: 0.15, eventPositiveBias: -0.15, expectedAvg: 60, rewardMultiplier: 0.75
  }
}

export const STAT_MAX: Record<keyof PlayerStats, number> = {
  credits: 999, mood: 100, energy: 100, hunger: 100, entertainment: 100, money: 999, roommateFavor: 100
}
export const STAT_MIN: Record<keyof PlayerStats, number> = {
  credits: 0, mood: 0, energy: 0, hunger: 0, entertainment: 0, money: 0, roommateFavor: 0
}

export const ROLL_CALL_BASE = {
  teacherLover: 0.6, teacherHater: 0.15, courseSeriousBonus: 0.1,
  earlyMorningBonus: 0.1, skipHistoryBonus: 0.05
}

export const ATTEND_EFFECT: PlayerStats = {
  credits: 4, mood: 0, energy: -8, hunger: -6, entertainment: -3, money: 0, roommateFavor: 0
}
export const SKIP_EFFECT: PlayerStats = {
  credits: 0, mood: 0, energy: 12, hunger: 8, entertainment: 10, money: 0, roommateFavor: 0
}
export const SUB_FOR_OTHER_EFFECT: PlayerStats = {
  credits: 2, mood: -2, energy: -12, hunger: -6, entertainment: -5, money: 20, roommateFavor: 0
}
export const HIRE_SUB_COST = 25
export const HIRE_SUB_RISK = 0.15

export const DAWN_EFFECTS: Record<string, PlayerStats> = {
  sleep_early: { credits: 0, mood: 5, energy: 30, hunger: -3, entertainment: -5, money: 0, roommateFavor: 5 },
  gaming:      { credits: 0, mood: 3, energy: -20, hunger: -5, entertainment: 25, money: 0, roommateFavor: -10 },
  cram:        { credits: 3, mood: -3, energy: -25, hunger: -3, entertainment: -8, money: 0, roommateFavor: 0 },
  go_out:      { credits: 0, mood: 10, energy: -15, hunger: 5, entertainment: 20, money: -20, roommateFavor: 0 },
  normal_rest: { credits: 0, mood: 1, energy: 10, hunger: -3, entertainment: 0, money: 0, roommateFavor: 2 }
}

export const DAILY_DECAY: PlayerStats = {
  credits: 0, mood: 0, energy: -5, hunger: -10, entertainment: -8, money: 0, roommateFavor: 0
}
```

---

### BE-3: 随机工具 `src/engine/random.ts`

```ts
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
export function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}
export function chance(probability: number): boolean {
  return Math.random() < probability
}
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
export function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
export function weightedPick<T>(items: [T, number][]): T {
  const total = items.reduce((sum, [, w]) => sum + w, 0)
  let r = Math.random() * total
  for (const [value, weight] of items) {
    r -= weight; if (r <= 0) return value
  }
  return items[items.length - 1][0]
}
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
export function probLabel(prob: number): 'low' | 'medium' | 'high' | 'very_high' {
  if (prob < 0.25) return 'low'; if (prob < 0.5) return 'medium'
  if (prob < 0.75) return 'high'; return 'very_high'
}
```

---

### BE-4: 课程与老师生成 `src/engine/courseGen.ts`

```ts
import type { Course, CourseType, DifficultyConfig, Teacher, TeacherSpecial, TeacherTrait } from './types'
import { pick, chance, probLabel } from './random'
import { ROLL_CALL_BASE } from './constants'

export function generateCourses(config: DifficultyConfig): Course[][] {
  const courses: Course[][] = []
  for (let day = 0; day < 7; day++) {
    const dayCourses: Course[] = []
    for (let slot = 0; slot < 9; slot++) {
      const type: CourseType = chance(config.courseSeriousRatio) ? 'serious' : 'easy'
      const teacher = generateTeacher()
      dayCourses.push({
        id: `d${day}-s${slot}`, name: '', type, teacher,
        timeSlotIndex: slot, estimatedRollCallProb: 'low'
      })
    }
    courses.push(dayCourses)
  }
  return courses
}

export function generateTeacher(): Teacher {
  const trait: TeacherTrait = chance(0.5) ? 'roll_call_lover' : 'roll_call_hater'
  let special: TeacherSpecial = null
  if (chance(0.15)) special = pick(['quiz_master', 'scripture_master', 'handwriting_only'])
  return { name: '', trait, special }
}

export function calcRollCallProb(
  course: Course, skipHistoryCount: number, config: DifficultyConfig
): number {
  let prob = course.teacher.trait === 'roll_call_lover'
    ? ROLL_CALL_BASE.teacherLover : ROLL_CALL_BASE.teacherHater
  if (course.type === 'serious') prob += ROLL_CALL_BASE.courseSeriousBonus
  if (course.timeSlotIndex === 0) prob += ROLL_CALL_BASE.earlyMorningBonus
  prob += skipHistoryCount * ROLL_CALL_BASE.skipHistoryBonus + config.rollCallBias
  return Math.max(0, Math.min(1, prob))
}

export function checkRollCall(prob: number): boolean { return chance(prob) }

export function finalizeCourses(
  courses: Course[][], courseNames: string[],
  teacherNames: Record<TeacherTrait, string[]>,
  skipHistoryCount: number, config: DifficultyConfig
): void {
  for (const dayCourses of courses) {
    for (const course of dayCourses) {
      course.name = pick(courseNames)
      course.teacher.name = pick(teacherNames[course.teacher.trait])
      course.estimatedRollCallProb = probLabel(calcRollCallProb(course, skipHistoryCount, config))
    }
  }
}
```

---

### BE-5: 行为结算 `src/engine/actions.ts`

```ts
import type { Course, CourseAction, DawnAction, PlayerStats, StatsDelta, DifficultyConfig } from './types'
import { ATTEND_EFFECT, SKIP_EFFECT, SUB_FOR_OTHER_EFFECT, HIRE_SUB_COST, HIRE_SUB_RISK, DAWN_EFFECTS } from './constants'
import { chance } from './random'
import { checkRollCall, calcRollCallProb } from './courseGen'

export interface ActionResult {
  deltas: StatsDelta
  description: string
  triggeredRollCall: boolean
  triggeredSleep: boolean
  triggeredPhone: boolean
  hireSubFailed: boolean
}

export function resolveCourseAction(
  action: CourseAction, course: Course, stats: PlayerStats,
  skipHistoryCount: number, config: DifficultyConfig
): ActionResult {
  const mult = config.rewardMultiplier
  const deltas: StatsDelta = {}
  let description = ''
  let triggeredRollCall = false, triggeredSleep = false, triggeredPhone = false, hireSubFailed = false

  switch (action) {
    case 'attend': {
      applyEffect(deltas, ATTEND_EFFECT, mult)
      if (stats.mood >= 70) {
        deltas.credits = (deltas.credits ?? 0) + Math.round(2 * mult)
        description = '你心情大好，上课效率爆表，甚至主动回答了问题！'
      } else if (stats.mood <= 30) {
        deltas.credits = Math.max(0, (deltas.credits ?? 0) - 1)
        description = '人在教室魂在飞，你一个字都没听进去……'
      } else {
        description = '你老实坐在教室里，时间过得比树懒还慢。'
      }
      if (stats.energy <= 25 && chance(0.4)) {
        deltas.credits = (deltas.credits ?? 0) - 1; triggeredSleep = true
        description += ' 然后你睡着了。老师看了你一眼，忍住了没砸粉笔。'
      }
      if (stats.entertainment <= 25 && chance(0.35)) {
        deltas.credits = (deltas.credits ?? 0) - 1; triggeredPhone = true
        description += ' 实在无聊，你掏出手机刷了整节课。'
      }
      if (course.teacher.trait === 'roll_call_lover' && checkRollCall(calcRollCallProb(course, skipHistoryCount, config))) {
        triggeredRollCall = true
        description += ' 老师点名了——还好你在教室，淡定答了"到"。'
      }
      break
    }
    case 'skip': {
      applyEffect(deltas, SKIP_EFFECT, mult)
      if (checkRollCall(calcRollCallProb(course, skipHistoryCount, config))) {
        triggeredRollCall = true; deltas.credits = (deltas.credits ?? 0) - 3
        description = '你翘课了。然后老师点名了。恭喜你喜提一次"重点关注"。'
      } else {
        description = pick([
          '你成功翘课，在宿舍床上度过了一段美好时光。',
          '你溜去食堂吃了顿好的，幸福感暴增。',
          '旷课一时爽，一直旷课一直爽。今天老师没点名，你是幸运的。',
          '你躲在图书馆摸鱼，假装自己在学习。'
        ])
      }
      break
    }
    case 'sub_for_other': {
      applyEffect(deltas, SUB_FOR_OTHER_EFFECT, mult)
      description = '你替别人上了一节课，赚了一笔外快。虽然坐得腰酸背痛，但看着钱包鼓起来，值了。'
      if (course.teacher.trait === 'roll_call_lover' && chance(0.2))
        description += ' 老师点到你替的人的名字，你硬着头皮答了"到"，有惊无险。'
      break
    }
    case 'hire_sub': {
      deltas.money = -(HIRE_SUB_COST)
      if (chance(HIRE_SUB_RISK)) {
        hireSubFailed = true; deltas.credits = -3
        description = `你花了 ¥${HIRE_SUB_COST} 找人代课，结果那人也翘了！！你被双重背叛，学分和钱都没了。`
      } else {
        description = checkRollCall(calcRollCallProb(course, skipHistoryCount, config))
          ? `花了 ¥${HIRE_SUB_COST}，代课小哥帮你稳稳答了"到"，钱花得值。`
          : `花了 ¥${HIRE_SUB_COST} 找人代课，轻松混过一节课。钱包瘦了，但人是自由的。`
      }
      break
    }
  }
  return { deltas, description, triggeredRollCall, triggeredSleep, triggeredPhone, hireSubFailed }
}

export function resolveDawnAction(action: DawnAction): { deltas: StatsDelta; description: string } {
  const deltas = { ...DAWN_EFFECTS[action] }
  let description = ''
  switch (action) {
    case 'sleep_early': description = '你十点就睡了，第二天醒来感觉像是换了个人——精力充沛得能跑马拉松。'; break
    case 'gaming': description = '你打到凌晨三点，段位升了两颗星，但你的身体在疯狂抗议。舍友在床上翻来覆去，怨气值上升中……'; break
    case 'cram': description = '通宵赶作业，deadline 是第一生产力。天亮时作业写完了，人也快完了。'; break
    case 'go_out':
      description = '你出去浪了一晚上，快乐是真实的，钱包是空虚的。至于明天早八？那是明天的事。'
      deltas.roommateFavor = Math.random() > 0.5 ? 5 : -5
      break
    case 'normal_rest': description = '平平无奇的一个夜晚，你正常休息，没什么特别的事发生。'; break
  }
  return { deltas, description }
}

function applyEffect(deltas: StatsDelta, effect: PlayerStats, multiplier: number): void {
  for (const key of Object.keys(effect) as (keyof PlayerStats)[]) {
    const val = effect[key]
    if (val !== 0) deltas[key] = (deltas[key] ?? 0) + Math.round(val * multiplier)
  }
}
```

---

### BE-6: 事件系统 `src/engine/events.ts`

```ts
import type { GameEvent, GameState, StatsDelta } from './types'
import { chance, pick } from './random'

export function findEligibleEvents(
  pool: GameEvent[], state: GameState, phase: 'dawn' | 'course_break'
): GameEvent[] {
  return pool.filter(e => {
    if (e.phase !== phase || state.usedEventIds.has(e.id)) return false
    return checkTrigger(e, state)
  })
}

export function tryTriggerEvent(eligible: GameEvent[], baseChance = 0.35): GameEvent | null {
  if (eligible.length === 0 || !chance(baseChance)) return null
  return pick(eligible)
}

export function resolveEventOption(event: GameEvent, optionIndex: number): { deltas: StatsDelta; flavorText: string } {
  const opt = event.options[optionIndex]
  return { deltas: { ...opt.effects }, flavorText: opt.flavorText }
}

function checkTrigger(event: GameEvent, state: GameState): boolean {
  const { stats, courses, day, courseIndex, currentDecision } = state
  const id = event.id

  if (id.startsWith('roll_call_crisis')) {
    const course = courses[day - 1]?.[courseIndex]
    return course != null && currentDecision?.courseActions[courseIndex] === 'skip'
      && course.teacher.trait === 'roll_call_lover'
  }
  if (id.startsWith('class_quiz')) {
    const course = courses[day - 1]?.[courseIndex]
    return course != null && currentDecision?.courseActions[courseIndex] === 'attend'
      && course.teacher.special === 'quiz_master'
  }
  if (id.startsWith('social_invite')) return stats.roommateFavor >= 40
  if (id.startsWith('roommate_rage')) return currentDecision?.dawnAction === 'gaming' && stats.roommateFavor <= 40
  if (id.startsWith('late_emo')) return stats.mood <= 35 && currentDecision?.dawnAction !== 'sleep_early'
  if (id.startsWith('surprise_quiz')) {
    const course = courses[day - 1]?.[courseIndex]
    return course != null && course.type === 'serious' && stats.credits < 20
  }
  if (id.startsWith('early_bird')) return currentDecision?.dawnAction === 'sleep_early'
  if (id.startsWith('random_')) return true

  return false
}
```

---

### BE-7: 每日结算 `src/engine/settlement.ts`

```ts
import type { GameState, StatsDelta, PlayerStats } from './types'
import { STAT_MAX, STAT_MIN, DAILY_DECAY } from './constants'

export interface SettlementResult {
  deltas: StatsDelta; moodDeltaFromAvg: number
  warningTriggered: boolean; gameOver: boolean; description: string
}

export function settleDay(state: GameState): SettlementResult {
  const { stats, pendingDeltas, thresholds } = state
  const totalDeltas: StatsDelta = { ...pendingDeltas }

  for (const key of Object.keys(DAILY_DECAY) as (keyof PlayerStats)[])
    totalDeltas[key] = (totalDeltas[key] ?? 0) + DAILY_DECAY[key]

  const secondaryAvg = (stats.energy + stats.hunger + stats.entertainment) / 3
  const moodDeltaFromAvg = Math.round((secondaryAvg - thresholds.expectedAvg) / 10)
  totalDeltas.mood = (totalDeltas.mood ?? 0) + moodDeltaFromAvg

  let description = moodDeltaFromAvg > 3 ? '今天吃好睡好玩好，心情美滋滋！'
    : moodDeltaFromAvg < -3 ? '今天过得一团糟，身心俱疲……' : '平平无奇的一天结束了。'

  const warningTriggered = (stats.credits + (totalDeltas.credits ?? 0)) < thresholds.warningCredits
  if (warningTriggered) description += ' ⚠️ 教务处提醒：你的学分进入危险区！'

  const gameOver = (stats.mood + (totalDeltas.mood ?? 0)) <= thresholds.crashMood
  return { deltas: totalDeltas, moodDeltaFromAvg, warningTriggered, gameOver, description }
}

export function applyDeltas(stats: PlayerStats, deltas: StatsDelta): PlayerStats {
  const result = { ...stats }
  for (const key of Object.keys(deltas) as (keyof PlayerStats)[]) {
    const delta = deltas[key] ?? 0
    result[key] = Math.max(STAT_MIN[key], Math.min(STAT_MAX[key], result[key] + delta))
  }
  return result
}
```

---

### BE-8: 评价系统 `src/engine/evaluation.ts`

```ts
import type { GameState, Evaluation, Rating } from './types'

export function evaluate(state: GameState): Evaluation {
  const { stats, decisions, thresholds } = state
  const creditScore = normalizeCredits(stats.credits, thresholds)
  const secondaryAvg = (stats.energy + stats.hunger + stats.entertainment) / 3

  let totalSkips = 0, totalCourses = 0
  for (const d of decisions) for (const a of d.courseActions) {
    if (a === 'skip') totalSkips++; totalCourses++
  }
  const skipRate = totalCourses > 0 ? totalSkips / totalCourses : 0

  const composite = creditScore * 0.35 + (stats.mood / 100) * 20 + (secondaryAvg / 100) * 20
    + (stats.money / 100) * 5 + (stats.roommateFavor / 100) * 10 + (1 - skipRate) * 10

  let rating: Rating
  if (composite >= 85) rating = 'S'; else if (composite >= 70) rating = 'A'
  else if (composite >= 50) rating = 'B'; else if (composite >= 35) rating = 'C'
  else rating = 'D'

  const { title, comment } = matchTitle(rating, stats, skipRate)
  return { rating, title, comment }
}

function normalizeCredits(c: number, t: GameState['thresholds']): number {
  if (c >= t.tutorCredits) return 95; if (c >= t.passCredits + 10) return 75
  if (c >= t.passCredits) return 55; return 30
}

interface TC { check: (s: GameState['stats'], r: number) => boolean; title: string; comment: string }

const TITLE_POOL: Record<Rating, TC[]> = {
  S: [
    { check: s => s.credits >= 70 && s.mood >= 70, title: '卷王之王', comment: '学得好心态还稳，同学们怀疑你是 AI。' },
    { check: s => s.money >= 80, title: '商业鬼才', comment: '课没上几节，钱没少挣，你是懂大学生存的。' },
    { check: s => s.roommateFavor >= 80, title: '社交恐怖分子', comment: '人缘好到舍友愿意替你去考试。' },
    { check: () => true, title: '六边形战士', comment: '德智体美劳全面发展（稀有物种）。' }
  ],
  A: [
    { check: s => s.credits >= 60 && s.mood < 50, title: '苦行学霸', comment: '学分到手了，精神状态让舍友担忧。' },
    { check: (s, r) => r > 0.5 && s.credits >= 45, title: '逃课仙人', comment: '你用实力证明：课，真的可以不上。' },
    { check: s => s.money >= 60, title: '金牌替身', comment: '帮别人上的课比给自己上的还多，代课界传奇。' },
    { check: () => true, title: '稳中带皮', comment: '大学生活典范，该学学该玩玩。' }
  ],
  B: [
    { check: s => s.money >= 50, title: '小资学渣', comment: '学习不行，搞钱在行。' },
    { check: s => s.roommateFavor >= 60, title: '人情战士', comment: '靠人际关系撑过了这周。' },
    { check: () => true, title: '凑合过吧', comment: '还能离咋的，日子总得过下去。' }
  ],
  C: [
    { check: s => s.mood >= 50, title: '摆烂の胜利', comment: '心态好就是真的好，学分不重要。' },
    { check: s => s.money >= 40, title: '暴发户学渣', comment: '有钱能使鬼推磨，硬靠钞能力撑过这周。' },
    { check: s => s.roommateFavor >= 50, title: '寄生虫の奇迹', comment: '没有舍友你第一天就退学了。' },
    { check: () => true, title: '侥幸毕业', comment: '学位证打印店 50 块做的，好歹是个证。' }
  ],
  D: [
    { check: () => true, title: '学渣之王', comment: '教务处的退学通知书都印好了，被你手快撕了。' }
  ]
}

function matchTitle(rating: Rating, stats: GameState['stats'], skipRate: number): { title: string; comment: string } {
  for (const c of TITLE_POOL[rating]) if (c.check(stats, skipRate)) return { title: c.title, comment: c.comment }
  return { title: '未知生物', comment: '你的大学生涯是一个谜。' }
}

export function evaluateFailure(stats: GameState['stats']): Evaluation {
  if (stats.credits < 10) return { rating: 'D', title: '全面溃败', comment: '学习和生活双双缴械，你可能是来大学旅游的。' }
  return { rating: 'D', title: '高处不胜寒', comment: '学分够了，人没了。下次记得对自己好一点。' }
}
```

---

### BE-9: 状态机 `src/engine/gameLoop.ts`

```ts
import type { GamePhase } from './types'

export function nextPhase(current: GamePhase, options?: {
  isLastCourse?: boolean; hasEvent?: boolean; isLastDay?: boolean; gameOver?: boolean
}): GamePhase {
  switch (current) {
    case 'START': return 'NIGHT_DECISION'
    case 'NIGHT_DECISION': return 'DAWN'
    case 'DAWN': return options?.hasEvent ? 'DAWN_EVENT' : 'DAY_PROGRESSION'
    case 'DAWN_EVENT': return 'DAY_PROGRESSION'
    case 'DAY_PROGRESSION':
      if (options?.hasEvent) return 'EVENT'
      if (options?.isLastCourse) return 'DAY_SETTLEMENT'
      return 'DAY_PROGRESSION'
    case 'EVENT': return options?.isLastCourse ? 'DAY_SETTLEMENT' : 'DAY_PROGRESSION'
    case 'DAY_SETTLEMENT':
      if (options?.gameOver) return 'GAME_OVER'
      if (options?.isLastDay) return 'GAME_WIN'
      return 'NIGHT_DECISION'
    case 'GAME_OVER': case 'GAME_WIN': return 'START'
    default: return 'START'
  }
}

export function phaseDuration(phase: GamePhase): number {
  switch (phase) {
    case 'DAWN': return 2000; case 'DAY_PROGRESSION': return 2500
    case 'DAY_SETTLEMENT': return 3000; default: return 0
  }
}
```

---

### BE-10: 状态工厂 `src/engine/state.ts`

```ts
import type { GameState, Difficulty } from './types'
import { DIFFICULTY_CONFIGS, DEFAULT_THRESHOLDS } from './constants'
import { generateCourses } from './courseGen'

export function createInitialState(difficulty: Difficulty): GameState {
  const config = DIFFICULTY_CONFIGS[difficulty]
  return {
    phase: 'START', day: 1, courseIndex: 0,
    stats: { ...config.initialStats },
    thresholds: { ...DEFAULT_THRESHOLDS[difficulty] },
    difficulty, difficultyConfig: config,
    courses: generateCourses(config),
    decisions: [], currentDecision: null, activeEvent: null,
    history: [], pendingDeltas: {}, usedEventIds: new Set(), showWarning: false
  }
}

export function cloneState(state: GameState): GameState {
  return {
    ...state, stats: { ...state.stats }, thresholds: { ...state.thresholds },
    difficultyConfig: { ...state.difficultyConfig },
    courses: state.courses.map(day => day.map(c => ({ ...c, teacher: { ...c.teacher } }))),
    decisions: state.decisions.map(d => ({ ...d, courseActions: [...d.courseActions] })),
    currentDecision: state.currentDecision
      ? { ...state.currentDecision, courseActions: [...state.currentDecision.courseActions] } : null,
    activeEvent: state.activeEvent
      ? { ...state.activeEvent, options: state.activeEvent.options.map(o => ({ ...o, effects: { ...o.effects } })) } : null,
    history: [...state.history], pendingDeltas: { ...state.pendingDeltas },
    usedEventIds: new Set(state.usedEventIds)
  }
}
```

---

### BE-11: 文案池 - 课程名与老师名

`src/content/courseNames.ts`:

```ts
export const COURSE_NAMES = [
  '高等数学（睡觉版）', '摸鱼学导论', '食堂鉴赏与实战', 'Java 从入门到放弃',
  '中国近现代睡梦史', '大学生存指南', '概率论与随机翘课', '如何优雅地混学分',
  '网课挂机技巧', '马克思原理（催眠版）', '线性代数（玄学分支）', 'C语言从入门到入土',
  '选修：如何在课堂上睁眼睡觉', '大学英语（哑巴专项训练）', '体育课（体测噩梦版）',
  '思修：如何在道德与翘课间找到平衡', '数据结构与摸鱼算法', '操作系统（Windows 蓝屏鉴赏）',
  '计算机组成原理（拆机装不回去版）', '数字电路（短路模拟器）', '大学物理（公式背诵大赛）',
  '微积分（极限挑战）', '概率论（玄学预测）', '管理学（甩锅理论）',
  '市场营销（画饼学）', '会计学（做账的艺术）', '心理学（读心术入门）',
  '职业规划（画大饼实操）', '形势与政策（新闻联播文字版）', '心理健康教育（防止emo指南）',
  '创新与创业（PPT演讲大赛）', '口才与演讲（吹牛速成班）',
  'Excel 数据处理（VLOOKUP 神教）', 'Python 爬虫（从入门到入狱）'
]
```

`src/content/teacherNames.ts`:

```ts
export const TEACHER_NAMES = {
  roll_call_lover: ['李点名','赵必查','王签到','张严打','刘考勤','陈点名册','杨出勤','吴记过','郑眼尖','孙盯人'],
  roll_call_hater: ['王划水','李放水','张随缘','赵佛系','刘摸鱼','陈宽松','杨无为','吴睁只眼','郑闭只眼','孙不管']
}
```

---

### BE-12: 文案池 - 事件文案 `src/content/eventTexts.ts`

```ts
import type { GameEvent } from '../engine/types'

export const EVENT_POOL: GameEvent[] = [
  // ========== 课间事件 ==========
  {
    id: 'roll_call_crisis_1', phase: 'course_break',
    triggerCondition: 'skip + teacher roll_call_lover',
    title: '🚨 点名危机！',
    description: '舍友紧急来电："兄弟！！下节课老李要查人！！你人在哪？！"',
    options: [
      { text: '🏃 飞奔回教室', effects: { energy: -10 }, flavorText: '你以百米冲刺速度跑回教室，在老师点到你名字的前一秒推开了门。有惊无险。' },
      { text: '🤷 不管了', effects: { credits: -4, mood: -3 }, flavorText: '你选择了摆烂。老师记下了你的名字，发出意味深长的冷笑。' },
      { text: '📱 叫舍友喊到', effects: { roommateFavor: -8 }, flavorText: '舍友捏着嗓子帮你喊了"到"。你欠舍友一个人情。' }
    ]
  },
  {
    id: 'class_quiz_1', phase: 'course_break',
    triggerCondition: 'attend + teacher quiz_master',
    title: '📝 突然提问！',
    description: '老师推了推眼镜，目光锁定你："这位同学，你来回答一下。"',
    options: [
      { text: '💪 自信作答', effects: { credits: 2, energy: -3 }, flavorText: '你临场发挥居然蒙对了！老师满意地点点头。' },
      { text: '🙈 低头装死', effects: { credits: -1 }, flavorText: '老师不吃这套。"下课后到我办公室来一趟。"' }
    ]
  },
  {
    id: 'social_invite_1', phase: 'course_break',
    triggerCondition: 'roommateFavor >= 40',
    title: '🍔 食堂邀约',
    description: '舍友发来微信："下课去食堂整点？今天有红烧肉！"',
    options: [
      { text: '🍖 必须去！', effects: { hunger: 15, mood: 8, money: -8 }, flavorText: '红烧肉真香！和舍友边吃边吐槽老师，心情大好。' },
      { text: '😐 算了下次吧', effects: { roommateFavor: -5 }, flavorText: '舍友回了一个"好吧"的表情包。' }
    ]
  },
  {
    id: 'random_teacher_dm_1', phase: 'course_break', triggerCondition: 'random',
    title: '📬 老师私信',
    description: '某老师发来微信："同学，上次的作业你好像还没交哦？"',
    options: [
      { text: '📝 立马补交', effects: { energy: -10, credits: 1 }, flavorText: '你熬夜肝完了作业。老师回了个"收到"。' },
      { text: '👻 装没看见', effects: { credits: -2, mood: -2 }, flavorText: '你装作没看到，但每次打开微信都心惊胆战。' }
    ]
  },
  {
    id: 'random_windfall_1', phase: 'course_break', triggerCondition: 'random low probability',
    title: '💸 天降横财',
    description: '你在教学楼门口低头一看——地上躺着一张 ¥50！四下无人。',
    options: [
      { text: '🤑 揣兜里', effects: { money: 50, mood: 5 }, flavorText: '横财到手！今天的伙食标准瞬间提高了一个档次。' },
      { text: '😇 交给失物招领', effects: { mood: 3 }, flavorText: '没赚到钱，但内心莫名地平静。' }
    ]
  },
  {
    id: 'surprise_quiz_1', phase: 'course_break',
    triggerCondition: 'serious course + low credits',
    title: '📋 突击测验！！',
    description: '据可靠消息，下节课有突击测验！而你几乎没听过课。',
    options: [
      { text: '📖 狂补笔记', effects: { energy: -12, credits: 3 }, flavorText: '你借学霸笔记疯狂抄了一中午。至少没交白卷。' },
      { text: '🎲 相信自己', effects: { credits: -3 }, flavorText: '你自信满满走进考场……发现自己连题目都看不懂。' }
    ]
  },
  // ========== 凌晨事件 ==========
  {
    id: 'roommate_rage_1', phase: 'dawn',
    triggerCondition: 'gaming + low roommateFavor',
    title: '😡 舍友暴怒',
    description: '凌晨两点，舍友猛地坐起来："你再敲那个键盘我就把你机箱扔下楼！！"',
    options: [
      { text: '🎧 戴耳机继续', effects: { entertainment: 10, roommateFavor: -15, mood: 2 }, flavorText: '你戴上耳机继续战斗。舍友的怨气已实体化。' },
      { text: '😴 乖乖关机', effects: { roommateFavor: 5, energy: 8 }, flavorText: '你识相地关了电脑。明天再战也不迟。' }
    ]
  },
  {
    id: 'late_emo_1', phase: 'dawn',
    triggerCondition: 'low mood + not sleep_early',
    title: '🌙 深夜 emo',
    description: '深夜两点，你突然开始思考人生意义——我为什么要上大学？我是谁？',
    options: [
      { text: '🎵 打开网抑云', effects: { entertainment: -5, mood: -8 }, flavorText: '越听越难受。今晚注定是个不眠之夜。' },
      { text: '🍜 点夜宵', effects: { money: -15, hunger: 10, mood: 5 }, flavorText: '热气腾腾的夜宵下肚，人生还是有意义的。' }
    ]
  },
  {
    id: 'random_midnight_takeout_1', phase: 'dawn', triggerCondition: 'random',
    title: '📱 深夜外卖诱惑',
    description: '满 30 减 15，满 50 减 25——这个力度不点还是人？！',
    options: [
      { text: '🍕 果断下单', effects: { money: -20, hunger: 15, mood: 8 }, flavorText: '深夜碳水，治愈一切。' },
      { text: '😤 忍住省钱', effects: {}, flavorText: '你咬了咬牙关掉 App。省下的钱在心里说了声谢谢。' }
    ]
  },
  {
    id: 'early_bird_1', phase: 'dawn',
    triggerCondition: 'sleep_early',
    title: '🌅 早起的感觉',
    description: '清晨六点自然醒，窗外有鸟叫，空气清新，人生充满希望。',
    options: [
      { text: '🏃 去跑步', effects: { energy: 10, mood: 5 }, flavorText: '跑了三圈，感受到了久违的内啡肽。' },
      { text: '🛏️ 再睡会', effects: { energy: 15 }, flavorText: '翻了个身又睡了两小时。确实很爽。' }
    ]
  }
]
```

---

### BE-13: 文案池 - 反馈与评价

`src/content/feedbackTexts.ts`:

```ts
export const MOOD_FEEDBACK: Record<string, [string, number]> = {
  '80-100': ['心情愉悦，感觉自己是天选之子', 0], '50-79': ['心态平稳，问题不大', 1],
  '20-49': ['开始烦躁，想打人', 2], '5-19': ['emo中，生人勿近', 3], '0-4': ['已崩溃，建议重开', 4]
}
export const ENERGY_FEEDBACK: Record<string, [string, number]> = {
  '70-100': ['精力充沛，能跑马拉松', 0], '40-69': ['还行，能撑住', 1],
  '15-39': ['眼皮打架，建议立刻昏迷', 2], '0-14': ['随时可能猝倒', 3]
}
export const HUNGER_FEEDBACK: Record<string, [string, number]> = {
  '70-100': ['肚子饱饱，心满意足', 0], '40-69': ['微饿，还能忍', 1],
  '15-39': ['肚子咕咕叫，同学投来关切目光', 2], '0-14': ['饿到产生幻觉，看什么都像鸡腿', 3]
}
export const ENTERTAINMENT_FEEDBACK: Record<string, [string, number]> = {
  '70-100': ['精神世界丰富多彩', 0], '40-69': ['有点无聊', 1],
  '15-39': ['无聊到数教室灯管', 2], '0-14': ['精神枯竭，渴望任何形式的刺激', 3]
}

export function getFeedback(value: number, table: Record<string, [string, number]>): [string, number] {
  for (const [range, data] of Object.entries(table)) {
    const [lo, hi] = range.split('-').map(Number)
    if (value >= lo && value <= hi) return data
  }
  return ['', 0]
}
```

`src/content/evaluationTexts.ts`:

```ts
export const DAILY_SETTLEMENT_FLAVORS = [
  '第{day}天结束。你还活着，这已经是一种胜利。',
  '第{day}天过去了，你离毕业又近了一步。大概。',
  '第{day}天结束了。你的大学时光又少了一天。',
  '第{day}天，你成功地在大学里又混了一天。',
  '第{day}天打卡完成！距离解脱还剩 {remaining} 天。'
]

export const PHASE_TITLES: Record<string, string> = {
  NIGHT_DECISION: '夜深了……安排明天的作战计划',
  DAWN: '凌晨时分', DAY_PROGRESSION: '第 {day} 天 · 课程进行中',
  DAY_SETTLEMENT: '第 {day} 天结算',
  GAME_OVER: '你倒下了……', GAME_WIN: '你成功毕业了！大概……'
}

export const CREDIT_WARNING = '⚠️ 教务处提醒：你的学分已进入危险区！再这样下去毕不了业。'
export const TUTOR_UNLOCK = '🎓 你的学分已达标！现在可以选"做家教"赚外快了！'
```

---

## 依赖关系

```
BE-1 (types) ──→ BE-2 (constants) ──→ BE-4 (courseGen) ──→ BE-5 (actions)
    │                                        │
    └──→ BE-3 (random) ──────────────────────┘
    │
    └──→ BE-6 (events) ←── BE-3
    └──→ BE-7 (settlement)
    └──→ BE-8 (evaluation)
    └──→ BE-9 (gameLoop)
    └──→ BE-10 (state) ←── BE-2, BE-4
    └──→ BE-11~13 (content) ← 独立可并行
```

## 推荐执行顺序

| 序号 | 任务 | 负责人 | 预估 |
|------|------|--------|------|
| 1 | BE-1 types | A+B 对齐 | 0.5h |
| 2 | BE-2 constants | A | 0.5h |
| 3 | BE-3 random | B | 0.3h |
| 4 | BE-4 courseGen | A | 0.5h |
| 5 | BE-5 actions | A | 0.5h |
| 6 | BE-6 events | B | 0.5h |
| 7 | BE-7 settlement | B | 0.5h |
| 8 | BE-8 evaluation | B | 0.5h |
| 9 | BE-9 gameLoop | A | 0.3h |
| 10 | BE-10 state | A | 0.3h |
| 11 | BE-11 课名+老师名 | A | 0.3h |
| 12 | BE-12 事件文案 | B | 0.5h |
| 13 | BE-13 反馈+评价 | B | 0.3h |

BE-3 至 BE-10 中 A 和 B 的任务大部分可并行。内容文案池（BE-11~13）可与引擎开发并行推进。
