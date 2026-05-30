# 《逃课模拟器》实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 从零构建"逃课模拟器"网页游戏——纯 TS 游戏引擎 + React 画面层，三人协作开发

**Architecture:** 纯 TS 引擎层（零 React 依赖）负责全部算法/数值/文案；Zustand store 作为桥接层；React + Framer Motion + Tailwind 负责画面表现。引擎层可脱离浏览器独立测试。

**Tech Stack:** Vite 8 + React 19 + TypeScript 6 + Zustand 5 + Framer Motion 12 + Tailwind CSS 4

**团队分工:**
- **前端 ×1**：React 组件、动画、Zustand store 桥接、Tailwind 样式
- **后端 ×2**：纯 TS 引擎（类型、算法、数值设计、规则引擎）+ 全部文案池

---

## 文件结构总览

```
src/
├── engine/                    # 【后端】纯 TS 游戏逻辑
│   ├── types.ts               #   所有类型定义
│   ├── constants.ts           #   常量（阈值默认值、难度配置表）
│   ├── state.ts               #   初始状态工厂 + 状态克隆
│   ├── random.ts              #   随机工具函数
│   ├── courseGen.ts           #   课程与老师随机生成
│   ├── rollCall.ts            #   点名概率计算与判定
│   ├── actions.ts             #   玩家行为效果计算（上课/旷课/代课/凌晨行为）
│   ├── events.ts              #   事件匹配逻辑 + 事件效果结算
│   ├── settlement.ts          #   每日结算（汇总 delta、心情联动、阈值检测）
│   ├── evaluation.ts          #   通关/失败判定 + 多维修结算评价
│   └── gameLoop.ts            #   游戏主循环状态机（phase 流转）
│
├── content/                   # 【后端】随机文案池（纯数据）
│   ├── courseNames.ts         #   课名池 ~30 条
│   ├── teacherNames.ts        #   老师名池 ~20 条 + 特殊属性
│   ├── eventTexts.ts          #   事件文案池（含选项/效果/触发条件）
│   ├── feedbackTexts.ts       #   数值区间反馈文案池
│   └── evaluationTexts.ts     #   评级称号 + 评语池
│
├── store/                     # 【前端】桥接层
│   └── gameStore.ts           #   Zustand store：state + dispatch + phase 推进
│
├── components/                # 【前端】React UI
│   ├── layout/
│   │   └── GameLayout.tsx     #   三栏布局框架
│   ├── phone/
│   │   ├── Phone.tsx          #   手机外框 + App 切换
│   │   ├── WeChatTab.tsx      #   微信消息列表
│   │   └── ScheduleTab.tsx    #   课表查看
│   ├── center/
│   │   ├── CenterPanel.tsx    #   中央区容器（按 phase 切换内容）
│   │   ├── StartScreen.tsx    #   开始画面 + 难度选择
│   │   ├── NightDecision.tsx  #   夜晚决策（9 节课 + 凌晨行为）
│   │   ├── DawnPhase.tsx      #   凌晨结算展示
│   │   ├── DayProgression.tsx #   白天课程推进展示
│   │   ├── EventModal.tsx     #   事件弹窗（选项按钮）
│   │   ├── DaySettlement.tsx  #   每日结算展示
│   │   ├── GameOver.tsx       #   失败画面
│   │   └── GameWin.tsx        #   通关评价画面
│   ├── status/
│   │   ├── StatusBar.tsx      #   右侧状态栏容器
│   │   └── StatItem.tsx       #   单项数值条
│   └── shared/
│       ├── FlyingNumber.tsx   #   飞字动画（+N/-N）
│       └── ScreenEffects.tsx  #   屏幕特效（红闪/震动/灰色边缘）
│
├── App.tsx                    #   根组件（单页面，无路由）
├── main.tsx                   #   Vite 入口
└── index.css                  #   Tailwind 入口
```

---

## 依赖安装（项目初始化，前后端共同）

### Task 0: 项目初始化

**执行者:** 前端（需先完成，后端才能开始使用 TS 类型）

- [ ] **Step 1: 安装新依赖**

```bash
cd D:/Hackthon/RunAwayClass
npm install zustand framer-motion
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: 配置 Tailwind**

修改 `vite.config.js`：

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

- [ ] **Step 3: 替换 index.css 为 Tailwind 入口**

```css
@import "tailwindcss";
```

- [ ] **Step 4: 清理旧文件**

```bash
# 删除模板页面和旧组件，只保留入口
rm -f src/App.css src/pages/*.jsx src/pages/*.css src/components/Layout.jsx src/components/Navbar.jsx src/assets/hero.png src/assets/react.svg src/assets/vite.svg
```

- [ ] **Step 5: 确认项目能跑**

```bash
npm run dev
```
浏览器打开后应看到空白页面无报错。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: init project with Zustand, Framer Motion, Tailwind"
```

---

---

## 第一部分：后端引擎层

> **执行者：后端 ×2**
> **原则：** 所有代码放 `src/engine/` 和 `src/content/`，零 React 依赖，可脱离浏览器用 Node 跑单元测试。
> **后端二人分工建议：**
> - 后端 A：类型 + 常量 + 随机 + 课程生成 + 点名 + 行为结算（types, constants, random, courseGen, rollCall, actions）
> - 后端 B：事件 + 结算 + 评价 + 主循环 + 全部文案池（events, settlement, evaluation, gameLoop, content/*）
> - 两人在开始前先一起对齐 `types.ts` 和 `constants.ts`

---

### Task BE-1: 类型定义

**Files:** Create `src/engine/types.ts`

> 此文件为整个项目的类型基石，前后端所有人引用。**必须先写，双方对齐后再各自开工。**

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

/** PlayerStats 的 delta 版本，所有字段可选 */
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

export type CourseType = 'easy' | 'serious'  // 水课 / 正课

export type TeacherTrait = 'roll_call_lover' | 'roll_call_hater'  // 爱点名 / 不爱点名

export type TeacherSpecial =
  | 'quiz_master'         // 随机提问狂魔
  | 'scripture_master'    // 课件念经大师
  | 'handwriting_only'    // 签到只认手写
  | null                  // 无特殊属性

export interface Teacher {
  name: string
  trait: TeacherTrait
  special: TeacherSpecial
}

export interface Course {
  id: string              // 如 "day1-course3"
  name: string
  type: CourseType
  teacher: Teacher
  timeSlotIndex: number   // 0-8
  estimatedRollCallProb: 'low' | 'medium' | 'high' | 'very_high'
}

// ==================== 时间 ====================

/** 9 节课时段 */
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
  text: string            // 选项按钮文案
  effects: StatsDelta     // 选中后的数值变化
  flavorText: string      // 选完后展示的反馈文字
}

export interface GameEvent {
  id: string
  phase: 'dawn' | 'course_break'
  triggerCondition: string  // 用于日志/调试的描述
  title: string             // 事件标题
  description: string       // 事件描述正文
  options: EventOption[]    // 2-3 个选项
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
  courseIndex: number         // 0-8，当前推进到第几节
  stats: PlayerStats
  thresholds: Thresholds
  difficulty: Difficulty
  difficultyConfig: DifficultyConfig
  courses: Course[][]         // [day][courseIndex]，7×9
  decisions: DayDecision[]    // 每日决策记录
  currentDecision: DayDecision | null
  activeEvent: GameEvent | null
  history: HistoryEntry[]
  pendingDeltas: StatsDelta   // 当日累计 delta，结算用
  usedEventIds: Set<string>   // 已触发事件 ID，避免重复
  showWarning: boolean        // 是否正在显示学分预警
}
```

- [ ] **Step 1: 后端二人一起过一遍所有类型，确认无遗漏后 Commit**

```bash
git add src/engine/types.ts && git commit -m "feat(engine): add type definitions"
```

---

### Task BE-2: 常量与难度配置

**Files:** Create `src/engine/constants.ts`

```ts
import type { Difficulty, DifficultyConfig, PlayerStats, Thresholds } from './types'

// ==================== 默认阈值 ====================

export const DEFAULT_THRESHOLDS: Record<Difficulty, Thresholds> = {
  easy: {
    passCredits: 30,
    warningCredits: 40,
    tutorCredits: 60,
    crashMood: 0,
    expectedAvg: 40
  },
  normal: {
    passCredits: 45,
    warningCredits: 55,
    tutorCredits: 70,
    crashMood: 0,
    expectedAvg: 50
  },
  hard: {
    passCredits: 60,
    warningCredits: 70,
    tutorCredits: 85,
    crashMood: 0,
    expectedAvg: 60
  }
}

// ==================== 难度配置 ====================

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    initialStats: { credits: 10, mood: 80, energy: 80, hunger: 80, entertainment: 80, money: 30, roommateFavor: 60 },
    courseSeriousRatio: 0.3,
    rollCallBias: -0.15,
    eventPositiveBias: 0.15,
    expectedAvg: 40,
    rewardMultiplier: 1.3
  },
  normal: {
    initialStats: { credits: 5, mood: 65, energy: 65, hunger: 65, entertainment: 65, money: 15, roommateFavor: 40 },
    courseSeriousRatio: 0.5,
    rollCallBias: 0,
    eventPositiveBias: 0,
    expectedAvg: 50,
    rewardMultiplier: 1.0
  },
  hard: {
    initialStats: { credits: 0, mood: 50, energy: 50, hunger: 50, entertainment: 50, money: 5, roommateFavor: 20 },
    courseSeriousRatio: 0.7,
    rollCallBias: 0.15,
    eventPositiveBias: -0.15,
    expectedAvg: 60,
    rewardMultiplier: 0.75
  }
}

// ==================== 数值上下限 ====================

export const STAT_MAX: Record<keyof PlayerStats, number> = {
  credits: 999,
  mood: 100,
  energy: 100,
  hunger: 100,
  entertainment: 100,
  money: 999,
  roommateFavor: 100
}

export const STAT_MIN: Record<keyof PlayerStats, number> = {
  credits: 0,
  mood: 0,
  energy: 0,
  hunger: 0,
  entertainment: 0,
  money: 0,
  roommateFavor: 0
}

// ==================== 点名基础概率 ====================

export const ROLL_CALL_BASE = {
  teacherLover: 0.6,      // 爱点名老师基础概率
  teacherHater: 0.15,      // 不爱点名老师基础概率
  courseSeriousBonus: 0.1, // 正课加成
  earlyMorningBonus: 0.1,  // 早八加成
  skipHistoryBonus: 0.05   // 每多旷一次课累加
}

// ==================== 行为数值表 ====================

/** attend 行为基础收益 */
export const ATTEND_EFFECT: PlayerStats = {
  credits: 4, mood: 0, energy: -8, hunger: -6, entertainment: -3, money: 0, roommateFavor: 0
}

/** skip 行为基础收益（旷课回血） */
export const SKIP_EFFECT: PlayerStats = {
  credits: 0, mood: 0, energy: 12, hunger: 8, entertainment: 10, money: 0, roommateFavor: 0
}

/** sub_for_other 帮人代课 */
export const SUB_FOR_OTHER_EFFECT: PlayerStats = {
  credits: 2, mood: -2, energy: -12, hunger: -6, entertainment: -5, money: 20, roommateFavor: 0
}

/** hire_sub 找人代课（花费金钱，规避风险） */
export const HIRE_SUB_COST = 25
export const HIRE_SUB_RISK = 0.15  // 15% 概率被坑（代课者也没去）

// ==================== 凌晨行为数值表 ====================

export const DAWN_EFFECTS: Record<string, PlayerStats> = {
  sleep_early:   { credits: 0, mood: 5, energy: 30, hunger: -3, entertainment: -5, money: 0, roommateFavor: 5 },
  gaming:        { credits: 0, mood: 3, energy: -20, hunger: -5, entertainment: 25, money: 0, roommateFavor: -10 },
  cram:          { credits: 3, mood: -3, energy: -25, hunger: -3, entertainment: -8, money: 0, roommateFavor: 0 },
  go_out:        { credits: 0, mood: 10, energy: -15, hunger: 5, entertainment: 20, money: -20, roommateFavor: 0 },
  normal_rest:   { credits: 0, mood: 1, energy: 10, hunger: -3, entertainment: 0, money: 0, roommateFavor: 2 }
}

// ==================== 自然衰减 ====================

/** 每天随时间的自然消耗（会加到每日结算中） */
export const DAILY_DECAY: PlayerStats = {
  credits: 0, mood: 0, energy: -5, hunger: -10, entertainment: -8, money: 0, roommateFavor: 0
}
```

- [ ] **Step 1: Commit**

```bash
git add src/engine/constants.ts && git commit -m "feat(engine): add constants and difficulty configs"
```

---

### Task BE-3: 随机工具函数

**Files:** Create `src/engine/random.ts`

```ts
/**
 * 返回 [min, max] 范围内的随机整数
 */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 返回 [min, max] 范围内的随机浮点数
 */
export function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * 以给定概率返回 true
 */
export function chance(probability: number): boolean {
  return Math.random() < probability
}

/**
 * 从数组中随机取一个元素
 */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * 从数组中随机取 N 个不重复元素
 */
export function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

/**
 * 洗牌（Fisher-Yates）
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 加权随机选择
 * items: [value, weight][]
 */
export function weightedPick<T>(items: [T, number][]): T {
  const total = items.reduce((sum, [, w]) => sum + w, 0)
  let r = Math.random() * total
  for (const [value, weight] of items) {
    r -= weight
    if (r <= 0) return value
  }
  return items[items.length - 1][0]
}

/**
 * 将数值 clamp 在上下限之间
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * 返回区间对应的文字标签
 */
export function probLabel(prob: number): 'low' | 'medium' | 'high' | 'very_high' {
  if (prob < 0.25) return 'low'
  if (prob < 0.5) return 'medium'
  if (prob < 0.75) return 'high'
  return 'very_high'
}
```

- [ ] **Step 1: Commit**

```bash
git add src/engine/random.ts && git commit -m "feat(engine): add random utility functions"
```

---

### Task BE-4: 课程与老师随机生成

**Files:** Create `src/engine/courseGen.ts`

```ts
import type { Course, CourseType, DifficultyConfig, Teacher, TeacherSpecial, TeacherTrait } from './types'
import { pick, chance, probLabel, shuffle } from './random'
import { ROLL_CALL_BASE } from './constants'

/**
 * 为一局游戏生成 7 天 × 9 节共 63 门课
 */
export function generateCourses(config: DifficultyConfig): Course[][] {
  const courses: Course[][] = []
  for (let day = 0; day < 7; day++) {
    const dayCourses: Course[] = []
    for (let slot = 0; slot < 9; slot++) {
      const type: CourseType = chance(config.courseSeriousRatio) ? 'serious' : 'easy'
      const teacher = generateTeacher()
      dayCourses.push({
        id: `d${day}-s${slot}`,
        name: '', // 由 content 层填入，此处占位
        type,
        teacher,
        timeSlotIndex: slot,
        estimatedRollCallProb: 'low' // 先占位，后面统一算
      })
    }
    courses.push(dayCourses)
  }
  return courses
}

/**
 * 随机生成一位老师
 */
export function generateTeacher(): Teacher {
  const trait: TeacherTrait = chance(0.5) ? 'roll_call_lover' : 'roll_call_hater'

  // 低概率附加特殊属性
  let special: TeacherSpecial = null
  if (chance(0.15)) {
    special = pick(['quiz_master', 'scripture_master', 'handwriting_only'])
  }

  return { name: '', trait, special }
}

/**
 * 计算实际点名概率 (0-1)
 */
export function calcRollCallProb(
  course: Course,
  skipHistoryCount: number,  // 玩家历史总旷课次数
  config: DifficultyConfig
): number {
  let prob = course.teacher.trait === 'roll_call_lover'
    ? ROLL_CALL_BASE.teacherLover
    : ROLL_CALL_BASE.teacherHater

  if (course.type === 'serious') prob += ROLL_CALL_BASE.courseSeriousBonus
  if (course.timeSlotIndex === 0) prob += ROLL_CALL_BASE.earlyMorningBonus  // 早八
  prob += skipHistoryCount * ROLL_CALL_BASE.skipHistoryBonus
  prob += config.rollCallBias

  return Math.max(0, Math.min(1, prob))
}

/**
 * 判定点名是否发生
 */
export function checkRollCall(prob: number): boolean {
  return chance(prob)
}

/**
 * 批量设置课程的估算点名概率和名称
 */
export function finalizeCourses(
  courses: Course[][],
  courseNames: string[],
  teacherNames: Record<TeacherTrait, string[]>,
  skipHistoryCount: number,
  config: DifficultyConfig
): void {
  for (const dayCourses of courses) {
    for (const course of dayCourses) {
      course.name = pick(courseNames)
      const traitNames = teacherNames[course.teacher.trait]
      course.teacher.name = pick(traitNames)
      const prob = calcRollCallProb(course, skipHistoryCount, config)
      course.estimatedRollCallProb = probLabel(prob)
    }
  }
}
```

- [ ] **Step 1: Commit**

```bash
git add src/engine/courseGen.ts && git commit -m "feat(engine): add course and teacher generation"
```

---

### Task BE-5: 玩家行为结算

**Files:** Create `src/engine/actions.ts`

```ts
import type { Course, CourseAction, DawnAction, PlayerStats, StatsDelta, DifficultyConfig } from './types'
import { ATTEND_EFFECT, SKIP_EFFECT, SUB_FOR_OTHER_EFFECT, HIRE_SUB_COST, HIRE_SUB_RISK, DAWN_EFFECTS } from './constants'
import { chance } from './random'
import { checkRollCall, calcRollCallProb } from './courseGen'

export interface ActionResult {
  deltas: StatsDelta
  description: string
  triggeredRollCall: boolean
  triggeredSleep: boolean    // 上课睡着
  triggeredPhone: boolean    // 上课玩手机
  hireSubFailed: boolean     // 代课被坑
}

/**
 * 对一节课执行玩家选择的行为，返回效果和描述
 */
export function resolveCourseAction(
  action: CourseAction,
  course: Course,
  stats: PlayerStats,
  skipHistoryCount: number,
  config: DifficultyConfig
): ActionResult {
  const mult = config.rewardMultiplier
  const deltas: StatsDelta = {}
  let description = ''
  let triggeredRollCall = false
  let triggeredSleep = false
  let triggeredPhone = false
  let hireSubFailed = false

  switch (action) {
    case 'attend': {
      // 基础收益
      applyEffect(deltas, ATTEND_EFFECT, mult)
      // 心情影响学分效率
      if (stats.mood >= 70) {
        deltas.credits = (deltas.credits ?? 0) + Math.round(2 * mult)
        description = '你心情大好，上课效率爆表，甚至主动回答了问题！'
      } else if (stats.mood <= 30) {
        deltas.credits = Math.max(0, (deltas.credits ?? 0) - 1)
        description = '人在教室魂在飞，你一个字都没听进去……'
      } else {
        description = '你老实坐在教室里，时间过得比树懒还慢。'
      }
      // 低精力触发睡着
      if (stats.energy <= 25 && chance(0.4)) {
        deltas.credits = (deltas.credits ?? 0) - 1
        triggeredSleep = true
        description += ' 然后你睡着了。老师看了你一眼，忍住了没砸粉笔。'
      }
      // 低娱乐触发玩手机
      if (stats.entertainment <= 25 && chance(0.35)) {
        deltas.credits = (deltas.credits ?? 0) - 1
        triggeredPhone = true
        description += ' 实在无聊，你掏出手机刷了整节课。'
      }
      // 点名判定
      if (course.teacher.trait === 'roll_call_lover') {
        const prob = calcRollCallProb(course, skipHistoryCount, config)
        if (checkRollCall(prob)) {
          triggeredRollCall = true
          // 上课时被点名答到是正常的，不扣分
          description += ' 老师点名了——还好你在教室，淡定答了"到"。'
        }
      }
      break
    }

    case 'skip': {
      applyEffect(deltas, SKIP_EFFECT, mult)
      const prob = calcRollCallProb(course, skipHistoryCount, config)
      if (checkRollCall(prob)) {
        triggeredRollCall = true
        deltas.credits = (deltas.credits ?? 0) - 3
        description = '你翘课了。然后老师点名了。恭喜你喜提一次"重点关注"。'
      } else {
        const skipDescs = [
          '你成功翘课，在宿舍床上度过了一段美好时光。',
          '你溜去食堂吃了顿好的，幸福感暴增。',
          '旷课一时爽，一直旷课一直爽。今天老师没点名，你是幸运的。',
          '你躲在图书馆摸鱼，假装自己在学习。'
        ]
        description = skipDescs[Math.floor(Math.random() * skipDescs.length)]
      }
      break
    }

    case 'sub_for_other': {
      applyEffect(deltas, SUB_FOR_OTHER_EFFECT, mult)
      description = '你替别人上了一节课，赚了一笔外快。虽然坐得腰酸背痛，但看着钱包鼓起来，值了。'
      // 帮人代课也有可能被点名问到
      if (course.teacher.trait === 'roll_call_lover' && chance(0.2)) {
        description += ' 老师点到你替的人的名字，你硬着头皮答了"到"，有惊无险。'
      }
      break
    }

    case 'hire_sub': {
      deltas.money = -(HIRE_SUB_COST)
      if (chance(HIRE_SUB_RISK)) {
        hireSubFailed = true
        deltas.credits = -3
        description = `你花了 ¥${HIRE_SUB_COST} 找人代课，结果那人也翘了！！你被双重背叛，学分和钱都没了。`
      } else {
        const prob = calcRollCallProb(course, skipHistoryCount, config)
        if (checkRollCall(prob)) {
          description = `花了 ¥${HIRE_SUB_COST}，代课小哥帮你稳稳答了"到"，钱花得值。`
        } else {
          description = `花了 ¥${HIRE_SUB_COST} 找人代课，轻松混过一节课。钱包瘦了，但人是自由的。`
        }
      }
      break
    }
  }

  return { deltas, description, triggeredRollCall, triggeredSleep, triggeredPhone, hireSubFailed }
}

/**
 * 结算凌晨行为
 */
export function resolveDawnAction(action: DawnAction): { deltas: StatsDelta; description: string } {
  const deltas = { ...DAWN_EFFECTS[action] }
  let description = ''

  switch (action) {
    case 'sleep_early':
      description = '你十点就睡了，第二天醒来感觉像是换了个人——精力充沛得能跑马拉松。'
      break
    case 'gaming':
      description = '你打到凌晨三点，段位升了两颗星，但你的身体在疯狂抗议。舍友在床上翻来覆去，怨气值上升中……'
      break
    case 'cram':
      description = '通宵赶作业，deadline 是第一生产力。天亮时作业写完了，人也快完了。'
      break
    case 'go_out':
      description = '你出去浪了一晚上，快乐是真实的，钱包是空虚的。至于明天早八？那是明天的事。'
      // 舍友好感度随机正向或负向
      deltas.roommateFavor = Math.random() > 0.5 ? 5 : -5
      break
    case 'normal_rest':
      description = '平平无奇的一个夜晚，你正常休息，没什么特别的事发生。'
      break
  }

  return { deltas, description }
}

/**
 * 将效果乘以倍率后应用到 delta
 */
function applyEffect(deltas: StatsDelta, effect: PlayerStats, multiplier: number): void {
  for (const key of Object.keys(effect) as (keyof PlayerStats)[]) {
    const val = effect[key]
    if (val !== 0) {
      deltas[key] = (deltas[key] ?? 0) + Math.round(val * multiplier)
    }
  }
}
```

- [ ] **Step 1: Commit**

```bash
git add src/engine/actions.ts && git commit -m "feat(engine): add player action resolution"
```

---

### Task BE-6: 事件系统

**Files:** Create `src/engine/events.ts`

```ts
import type { GameEvent, GameState, StatsDelta } from './types'
import { chance, pick, shuffle } from './random'

/**
 * 从事件池中筛选候选事件，返回匹配且未触发过的事件
 */
export function findEligibleEvents(
  pool: GameEvent[],
  state: GameState,
  phase: 'dawn' | 'course_break'
): GameEvent[] {
  const { stats, day, courses, courseIndex, currentDecision, usedEventIds } = state

  return pool.filter(e => {
    if (e.phase !== phase) return false
    if (usedEventIds.has(e.id)) return false
    return checkTrigger(e, state)
  })
}

/**
 * 从候选事件中随机触发一个（按概率）
 */
export function tryTriggerEvent(eligible: GameEvent[], baseChance: number = 0.35): GameEvent | null {
  if (eligible.length === 0) return null
  if (!chance(baseChance)) return null
  return pick(eligible)
}

/**
 * 结算事件选项效果
 */
export function resolveEventOption(
  event: GameEvent,
  optionIndex: number
): { deltas: StatsDelta; flavorText: string } {
  const option = event.options[optionIndex]
  return {
    deltas: { ...option.effects },
    flavorText: option.flavorText
  }
}

/**
 * 检测事件触发条件是否满足
 * 具体条件由 content 层在事件定义中提供 trigger 字段，
 * 此函数做运行时匹配
 */
function checkTrigger(event: GameEvent, state: GameState): boolean {
  const { stats, courses, day, courseIndex, currentDecision } = state

  // 用事件 ID 前缀判断触发类型
  const id = event.id

  // 点名危机类：需要正在 skip 且老师爱点名
  if (id.startsWith('roll_call_crisis')) {
    if (courseIndex < 0 || courseIndex >= 9) return false
    const course = courses[day - 1]?.[courseIndex]
    if (!course) return false
    const action = currentDecision?.courseActions[courseIndex]
    return action === 'skip' && course.teacher.trait === 'roll_call_lover'
  }

  // 课堂提问类：需要正在 attend 且老师有 quiz_master 属性
  if (id.startsWith('class_quiz')) {
    if (courseIndex < 0 || courseIndex >= 9) return false
    const course = courses[day - 1]?.[courseIndex]
    if (!course) return false
    const action = currentDecision?.courseActions[courseIndex]
    return action === 'attend' && course.teacher.special === 'quiz_master'
  }

  // 社交邀约类：舍友好感度较高
  if (id.startsWith('social_invite')) {
    return stats.roommateFavor >= 40
  }

  // 舍友暴怒类：凌晨 + 该天凌晨选了 gaming + 好感度较低
  if (id.startsWith('roommate_rage')) {
    return currentDecision?.dawnAction === 'gaming' && stats.roommateFavor <= 40
  }

  // 深夜 emo 类：凌晨 + 心情低 + 未早睡
  if (id.startsWith('late_emo')) {
    return stats.mood <= 35 && currentDecision?.dawnAction !== 'sleep_early'
  }

  // 突击测验类：正课 + 多日未上课
  if (id.startsWith('surprise_quiz')) {
    if (courseIndex < 0 || courseIndex >= 9) return false
    const course = courses[day - 1]?.[courseIndex]
    if (!course) return false
    return course.type === 'serious' && stats.credits < 20
  }

  // 早起鸟儿：选了早睡
  if (id.startsWith('early_bird')) {
    return currentDecision?.dawnAction === 'sleep_early'
  }

  // 通用随机类事件（天降横财、老师私信、外卖等）：无条件，纯概率
  if (id.startsWith('random_')) {
    return true
  }

  return false
}
```

- [ ] **Step 1: Commit**

```bash
git add src/engine/events.ts && git commit -m "feat(engine): add event system"
```

---

### Task BE-7: 每日结算与心情联动

**Files:** Create `src/engine/settlement.ts`

```ts
import type { GameState, StatsDelta, PlayerStats } from './types'
import { STAT_MAX, STAT_MIN, DAILY_DECAY } from './constants'

export interface SettlementResult {
  deltas: StatsDelta          // 包含自然衰减后的总 delta
  moodDeltaFromAvg: number    // 由精力饱腹娱乐均值带来的心情变动
  warningTriggered: boolean   // 是否触发学分预警
  gameOver: boolean           // 心情是否归零
  description: string
}

/**
 * 每日结算：汇总当日 delta + 自然衰减 + 心情联动 + 阈值检测
 */
export function settleDay(state: GameState): SettlementResult {
  const { stats, pendingDeltas, thresholds } = state
  const totalDeltas: StatsDelta = { ...pendingDeltas }

  // 1. 叠加自然衰减
  for (const key of Object.keys(DAILY_DECAY) as (keyof PlayerStats)[]) {
    totalDeltas[key] = (totalDeltas[key] ?? 0) + DAILY_DECAY[key]
  }

  // 2. 心情联动：精力饱腹娱乐均值 vs 期望值
  const secondaryAvg = (stats.energy + stats.hunger + stats.entertainment) / 3
  // 注意：用的是结算前的 stats，因为 delta 还没应用
  const moodDeltaFromAvg = Math.round((secondaryAvg - thresholds.expectedAvg) / 10)

  totalDeltas.mood = (totalDeltas.mood ?? 0) + moodDeltaFromAvg

  // 3. 生成描述
  let description = ''
  if (moodDeltaFromAvg > 3) {
    description = '今天吃好睡好玩好，心情美滋滋！'
  } else if (moodDeltaFromAvg < -3) {
    description = '今天过得一团糟，身心俱疲……'
  } else {
    description = '平平无奇的一天结束了。'
  }

  // 4. 检测学分预警
  const newCredits = stats.credits + (totalDeltas.credits ?? 0)
  const warningTriggered = newCredits < thresholds.warningCredits

  if (warningTriggered) {
    description += ' ⚠️ 教务处发来提醒：你的学分已经进入危险区！'
  }

  // 5. 检测心情归零
  const newMood = stats.mood + (totalDeltas.mood ?? 0)
  const gameOver = newMood <= thresholds.crashMood

  return { deltas: totalDeltas, moodDeltaFromAvg, warningTriggered, gameOver, description }
}

/**
 * 将 delta 应用到 stats，返回新 stats（clamp 到合法范围）
 */
export function applyDeltas(stats: PlayerStats, deltas: StatsDelta): PlayerStats {
  const result = { ...stats }
  for (const key of Object.keys(deltas) as (keyof PlayerStats)[]) {
    const delta = deltas[key] ?? 0
    result[key] = Math.max(STAT_MIN[key], Math.min(STAT_MAX[key], result[key] + delta))
  }
  return result
}
```

- [ ] **Step 1: Commit**

```bash
git add src/engine/settlement.ts && git commit -m "feat(engine): add daily settlement and mood linkage"
```

---

### Task BE-8: 通关评价计算

**Files:** Create `src/engine/evaluation.ts`

```ts
import type { GameState, Evaluation, Rating } from './types'

/**
 * 根据多维数值计算最终评价
 */
export function evaluate(state: GameState): Evaluation {
  const { stats, decisions, thresholds } = state

  // 计算各维度分数
  const creditScore = normalizeCredits(stats.credits, thresholds)
  const moodAvg = stats.mood  // 简化：用最终值代替均值
  const secondaryAvg = (stats.energy + stats.hunger + stats.entertainment) / 3

  // 统计旷课率
  let totalSkips = 0
  let totalCourses = 0
  for (const d of decisions) {
    for (const a of d.courseActions) {
      if (a === 'skip') totalSkips++
      totalCourses++
    }
  }
  const skipRate = totalCourses > 0 ? totalSkips / totalCourses : 0

  // 加权综合分
  const composite =
    creditScore * 0.35 +
    (moodAvg / 100) * 20 +
    (secondaryAvg / 100) * 20 +
    (stats.money / 100) * 5 +
    (stats.roommateFavor / 100) * 10 +
    (1 - skipRate) * 10  // 旷课越少分越高

  // 评级
  let rating: Rating
  if (composite >= 85) rating = 'S'
  else if (composite >= 70) rating = 'A'
  else if (composite >= 50) rating = 'B'
  else if (composite >= 35) rating = 'C'
  else rating = 'D'

  // 称号匹配
  const { title, comment } = matchTitle(rating, stats, skipRate, decisions)

  return { rating, title, comment }
}

function normalizeCredits(credits: number, thresholds: GameState['thresholds']): number {
  if (credits >= thresholds.tutorCredits) return 95
  if (credits >= thresholds.passCredits + 10) return 75
  if (credits >= thresholds.passCredits) return 55
  return 30
}

interface TitleCandidate {
  check: (stats: GameState['stats'], skipRate: number) => boolean
  title: string
  comment: string
}

const TITLE_POOL: Record<Rating, TitleCandidate[]> = {
  S: [
    { check: (s) => s.credits >= 70 && s.mood >= 70, title: '卷王之王', comment: '学得好心态还稳，同学们怀疑你是 AI。' },
    { check: (s) => s.money >= 80, title: '商业鬼才', comment: '课没上几节，钱没少挣，你是懂大学生存的。' },
    { check: (s) => s.roommateFavor >= 80, title: '社交恐怖分子', comment: '人缘好到舍友愿意替你去考试。' },
    { check: () => true, title: '六边形战士', comment: '德智体美劳全面发展的当代好青年（稀有物种）。' }
  ],
  A: [
    { check: (s) => s.credits >= 60 && s.mood < 50, title: '苦行学霸', comment: '学分到手了，精神状态让舍友担忧。' },
    { check: (s, r) => r > 0.5 && s.credits >= 45, title: '逃课仙人', comment: '你用实力证明：课，是真的可以不上。' },
    { check: (s) => s.money >= 60, title: '金牌替身', comment: '帮别人上的课比给自己上的还多，代课界传奇。' },
    { check: () => true, title: '稳中带皮', comment: '大学生活典范，该学学该玩玩。' }
  ],
  B: [
    { check: (s) => s.money >= 50, title: '小资学渣', comment: '学习不行，搞钱在行。' },
    { check: (s) => s.roommateFavor >= 60, title: '人情战士', comment: '靠人际关系撑过了这周。' },
    { check: () => true, title: '凑合过吧', comment: '还能离咋的，日子总得过下去。' }
  ],
  C: [
    { check: (s) => s.mood >= 50, title: '摆烂の胜利', comment: '心态好就是真的好，学分不重要。' },
    { check: (s) => s.money >= 40, title: '暴发户学渣', comment: '有钱能使鬼推磨，硬靠钞能力撑过这周。' },
    { check: (s) => s.roommateFavor >= 50, title: '寄生虫の奇迹', comment: '没有舍友你第一天就退学了。' },
    { check: () => true, title: '侥幸毕业', comment: '学位证打印店 50 块做的，好歹是个证。' }
  ],
  D: [
    { check: () => true, title: '学渣之王', comment: '教务处的退学通知书都印好了，被你手快撕了。' }
  ]
}

function matchTitle(
  rating: Rating,
  stats: GameState['stats'],
  skipRate: number,
  decisions: GameState['decisions']
): { title: string; comment: string } {
  const pool = TITLE_POOL[rating]
  for (const candidate of pool) {
    if (candidate.check(stats, skipRate)) {
      return { title: candidate.title, comment: candidate.comment }
    }
  }
  return { title: '未知生物', comment: '你的大学生涯是一个谜。' }
}

/**
 * 失败评价
 */
export function evaluateFailure(stats: GameState['stats']): Evaluation {
  if (stats.credits < 10) {
    return { rating: 'D', title: '全面溃败', comment: '学习和生活双双缴械，你可能是来大学旅游的。' }
  }
  return { rating: 'D', title: '高处不胜寒', comment: '学分够了，人没了。下次记得对自己好一点。' }
}
```

- [ ] **Step 1: Commit**

```bash
git add src/engine/evaluation.ts && git commit -m "feat(engine): add evaluation and rating system"
```

---

### Task BE-9: 游戏主循环状态机

**Files:** Create `src/engine/gameLoop.ts`

```ts
import type { GamePhase } from './types'

/**
 * 状态机流转规则（纯函数，不修改状态，只返回下一个 phase）
 */
export function nextPhase(current: GamePhase, options?: {
  isLastCourse?: boolean   // 是否最后一节课
  hasEvent?: boolean        // 是否有待处理事件
  isLastDay?: boolean       // 是否第7天
  gameOver?: boolean        // 是否触发失败
}): GamePhase {
  switch (current) {
    case 'START':
      return 'NIGHT_DECISION'

    case 'NIGHT_DECISION':
      return 'DAWN'

    case 'DAWN':
      if (options?.hasEvent) return 'DAWN_EVENT'
      return 'DAY_PROGRESSION'

    case 'DAWN_EVENT':
      return 'DAY_PROGRESSION'

    case 'DAY_PROGRESSION':
      if (options?.hasEvent) return 'EVENT'
      if (options?.isLastCourse) return 'DAY_SETTLEMENT'
      return 'DAY_PROGRESSION'  // 继续下一节

    case 'EVENT':
      if (options?.isLastCourse) return 'DAY_SETTLEMENT'
      return 'DAY_PROGRESSION'  // 事件处理完继续上课

    case 'DAY_SETTLEMENT':
      if (options?.gameOver) return 'GAME_OVER'
      if (options?.isLastDay) return 'GAME_WIN'
      return 'NIGHT_DECISION'

    case 'GAME_OVER':
      return 'START'  // 重新开始

    case 'GAME_WIN':
      return 'START'  // 重新开始

    default:
      return 'START'
  }
}

/**
 * 获取当前 phase 的展示时长建议（毫秒），用于自动推进
 */
export function phaseDuration(phase: GamePhase): number {
  switch (phase) {
    case 'DAWN': return 2000
    case 'DAY_PROGRESSION': return 2500
    case 'DAY_SETTLEMENT': return 3000
    default: return 0  // 需要玩家交互
  }
}
```

- [ ] **Step 1: Commit**

```bash
git add src/engine/gameLoop.ts && git commit -m "feat(engine): add game loop state machine"
```

---

### Task BE-10: 初始状态工厂

**Files:** Create `src/engine/state.ts`

```ts
import type { GameState, Difficulty } from './types'
import { DIFFICULTY_CONFIGS, DEFAULT_THRESHOLDS } from './constants'
import { generateCourses } from './courseGen'

/**
 * 创建一局新游戏的初始状态
 */
export function createInitialState(difficulty: Difficulty): GameState {
  const config = DIFFICULTY_CONFIGS[difficulty]
  const thresholds = DEFAULT_THRESHOLDS[difficulty]
  const courses = generateCourses(config)

  return {
    phase: 'START',
    day: 1,
    courseIndex: 0,
    stats: { ...config.initialStats },
    thresholds: { ...thresholds },
    difficulty,
    difficultyConfig: config,
    courses,
    decisions: [],
    currentDecision: null,
    activeEvent: null,
    history: [],
    pendingDeltas: {},
    usedEventIds: new Set(),
    showWarning: false
  }
}

/**
 * 深拷贝 GameState（用于不可变更新）
 */
export function cloneState(state: GameState): GameState {
  return {
    ...state,
    stats: { ...state.stats },
    thresholds: { ...state.thresholds },
    difficultyConfig: { ...state.difficultyConfig },
    courses: state.courses.map(day => day.map(c => ({ ...c, teacher: { ...c.teacher } }))),
    decisions: state.decisions.map(d => ({ ...d, courseActions: [...d.courseActions] })),
    currentDecision: state.currentDecision
      ? { ...state.currentDecision, courseActions: [...state.currentDecision.courseActions] }
      : null,
    activeEvent: state.activeEvent
      ? { ...state.activeEvent, options: state.activeEvent.options.map(o => ({ ...o, effects: { ...o.effects } })) }
      : null,
    history: [...state.history],
    pendingDeltas: { ...state.pendingDeltas },
    usedEventIds: new Set(state.usedEventIds)
  }
}
```

- [ ] **Step 1: Commit**

```bash
git add src/engine/state.ts && git commit -m "feat(engine): add initial state factory"
```

---

### Task BE-11: 文案池 — 课程名与老师名

**Files:** Create `src/content/courseNames.ts` and `src/content/teacherNames.ts`

`src/content/courseNames.ts`:

```ts
export const COURSE_NAMES = [
  '高等数学（睡觉版）',
  '摸鱼学导论',
  '食堂鉴赏与实战',
  'Java 从入门到放弃',
  '中国近现代睡梦史',
  '大学生存指南',
  '概率论与随机翘课',
  '如何优雅地混学分',
  '网课挂机技巧',
  '马克思原理（催眠版）',
  '线性代数（玄学分支）',
  'C语言从入门到入土',
  '选修：如何在课堂上睁眼睡觉',
  '大学英语（哑巴专项训练）',
  '体育课（体测噩梦版）',
  '思修：如何在道德与翘课间找到平衡',
  '数据结构与摸鱼算法',
  '操作系统（Windows 蓝屏鉴赏）',
  '计算机组成原理（拆机装不回去版）',
  '数字电路（短路模拟器）',
  '大学物理（公式背诵大赛）',
  '微积分（极限挑战）',
  '概率论（玄学预测）',
  '管理学（甩锅理论）',
  '市场营销（画饼学）',
  '会计学（做账的艺术）',
  '心理学（读心术入门）',
  '职业规划（画大饼实操）',
  '形势与政策（新闻联播文字版）',
  '心理健康教育（防止emo指南）',
  '创新与创业（PPT演讲大赛）',
  '口才与演讲（吹牛速成班）',
  'Excel 数据处理（VLOOKUP 神教）',
  'Python 爬虫（从入门到入狱）'
]
```

`src/content/teacherNames.ts`:

```ts
export const TEACHER_NAMES = {
  roll_call_lover: [
    '李点名', '赵必查', '王签到', '张严打', '刘考勤',
    '陈点名册', '杨出勤', '吴记过', '郑眼尖', '孙盯人'
  ],
  roll_call_hater: [
    '王划水', '李放水', '张随缘', '赵佛系', '刘摸鱼',
    '陈宽松', '杨无为', '吴睁只眼', '郑闭只眼', '孙不管'
  ]
}
```

- [ ] **Step 1: Commit**

```bash
git add src/content/courseNames.ts src/content/teacherNames.ts
git commit -m "feat(content): add course and teacher name pools"
```

---

### Task BE-12: 文案池 — 事件文案

**Files:** Create `src/content/eventTexts.ts`

```ts
import type { GameEvent } from '../engine/types'

/**
 * 全部随机事件池
 * 每个事件包含 id、phase、triggerCondition、title、description、options
 */
export const EVENT_POOL: GameEvent[] = [

  // ========== 课间事件 ==========

  {
    id: 'roll_call_crisis_1',
    phase: 'course_break',
    triggerCondition: 'skip + teacher roll_call_lover',
    title: '🚨 点名危机！',
    description: '舍友紧急来电："兄弟！！下节课老李要查人！！你人在哪？！"',
    options: [
      { text: '🏃 飞奔回教室', effects: { energy: -10 }, flavorText: '你以百米冲刺速度跑回教室，在老师点到你名字的前一秒推开了门。气喘吁吁但安全了。' },
      { text: '🤷 不管了，爱咋咋地', effects: { credits: -4, mood: -3 }, flavorText: '你选择了摆烂。老师记下了你的名字，并发出了意味深长的冷笑。' },
      { text: '📱 叫舍友帮忙喊到', effects: { roommateFavor: -8 }, flavorText: '舍友捏着嗓子帮你喊了"到"。老师狐疑地看了他一眼，但没深究。你欠舍友一个人情。' }
    ]
  },

  {
    id: 'class_quiz_1',
    phase: 'course_break',
    triggerCondition: 'attend + teacher quiz_master',
    title: '📝 突然提问！',
    description: '老师推了推眼镜，目光锁定你："这位同学，你来回答一下刚才讲的内容。"',
    options: [
      { text: '💪 自信作答', effects: { credits: 2, energy: -3 }, flavorText: '你临场发挥，居然蒙对了！老师满意地点了点头。' },
      { text: '🙈 低头装死', effects: { credits: -1 }, flavorText: '你假装低头看书，但老师不吃这套。"下课后到我办公室来一趟。"' }
    ]
  },

  {
    id: 'social_invite_1',
    phase: 'course_break',
    triggerCondition: 'roommateFavor >= 40',
    title: '🍔 食堂邀约',
    description: '舍友发来微信："下课去食堂整点？今天有红烧肉！"',
    options: [
      { text: '🍖 必须去！', effects: { hunger: 15, mood: 8, money: -8 }, flavorText: '红烧肉真香！和舍友边吃边吐槽老师，心情大好。' },
      { text: '😐 算了，下次吧', effects: { roommateFavor: -5 }, flavorText: '舍友回了一个"好吧"的表情包，你感觉有点愧疚。' }
    ]
  },

  {
    id: 'random_teacher_dm_1',
    phase: 'course_break',
    triggerCondition: 'random',
    title: '📬 老师私信',
    description: '某老师突然发来微信："同学，上次布置的作业你好像还没交哦？"',
    options: [
      { text: '📝 立马补交', effects: { energy: -10, credits: 1 }, flavorText: '你熬夜肝完了作业，赶在截止时间前提交。老师回了个"收到"。' },
      { text: '👻 装没看见', effects: { credits: -2, mood: -2 }, flavorText: '你装作没看到消息，但每一次打开微信都心惊胆战。' }
    ]
  },

  {
    id: 'random_windfall_1',
    phase: 'course_break',
    triggerCondition: 'random low probability',
    title: '💸 天降横财',
    description: '你在教学楼门口低头一看——地上躺着一张 ¥50 的钞票！四下无人。',
    options: [
      { text: '🤑 揣兜里', effects: { money: 50, mood: 5 }, flavorText: '横财到手！今天的伙食标准瞬间提高了一个档次。' },
      { text: '😇 交给失物招领', effects: { mood: 3 }, flavorText: '你微笑着把钱交到了失物招领处。虽然没赚到钱，但内心莫名地平静。' }
    ]
  },

  {
    id: 'surprise_quiz_1',
    phase: 'course_break',
    triggerCondition: 'serious course + low credits',
    title: '📋 突击测验！！',
    description: '据可靠消息，下节课老师准备了突击测验！而你……几乎没听过课。',
    options: [
      { text: '📖 狂补笔记', effects: { energy: -12, credits: 3 }, flavorText: '你借了学霸的笔记疯狂抄了一中午。测验结果还行，至少没交白卷。' },
      { text: '🎲 相信自己的直觉', effects: { credits: -3 }, flavorText: '你自信满满地走进考场……然后发现自己连题目都看不懂。下次还是别裸考了。' }
    ]
  },

  // ========== 凌晨事件 ==========

  {
    id: 'roommate_rage_1',
    phase: 'dawn',
    triggerCondition: 'gaming + low roommateFavor',
    title: '😡 舍友暴怒',
    description: '凌晨两点，舍友猛地坐起来："你再敲那个机械键盘我就把你机箱扔下楼！！"',
    options: [
      { text: '🎧 戴上耳机继续', effects: { entertainment: 10, roommateFavor: -15, mood: 2 }, flavorText: '你戴上了耳机，继续战斗。舍友的怨气已经实体化，在房间里飘荡。' },
      { text: '😴 乖乖关机睡觉', effects: { roommateFavor: 5, energy: 8 }, flavorText: '你识相地关了电脑。舍友翻了个身，终于睡着了。明天再战也不迟。' }
    ]
  },

  {
    id: 'late_emo_1',
    phase: 'dawn',
    triggerCondition: 'low mood + not sleep_early',
    title: '🌙 深夜 emo 时间',
    description: '深夜两点，你突然开始思考人生意义——我为什么要上大学？我是谁？我从哪里来？要到哪里去？',
    options: [
      { text: '🎵 打开网抑云', effects: { entertainment: -5, mood: -8 }, flavorText: '你听了一小时伤感歌曲，越听越难受。今晚注定是个不眠之夜。' },
      { text: '🍜 点一份夜宵安慰自己', effects: { money: -15, hunger: 10, mood: 5 }, flavorText: '热气腾腾的夜宵下肚，你突然觉得人生还是有意义的——至少还有好吃的。' }
    ]
  },

  {
    id: 'random_midnight_takeout_1',
    phase: 'dawn',
    triggerCondition: 'random',
    title: '📱 深夜外卖诱惑',
    description: '你刷到一家新开的深夜食堂，满 30 减 15，满 50 减 25——这个优惠力度，不点还是人？！',
    options: [
      { text: '🍕 果断下单', effects: { money: -20, hunger: 15, mood: 8 }, flavorText: '外卖送到时你感觉自己像是收到了圣诞礼物。深夜碳水，治愈一切。' },
      { text: '😤 忍住，省钱', effects: {}, flavorText: '你咬了咬牙，关掉了外卖 App。省下的钱在心里默默地对你说了声谢谢。' }
    ]
  },

  {
    id: 'early_bird_1',
    phase: 'dawn',
    triggerCondition: 'sleep_early',
    title: '🌅 早起的感觉',
    description: '清晨六点，你自然醒了。窗外有鸟叫，空气清新，感觉人生充满了希望。（这种感觉非常罕见，建议珍惜）',
    options: [
      { text: '🏃 去操场跑步', effects: { energy: 10, mood: 5 }, flavorText: '你在操场上跑了三圈，感受到了久违的内啡肽。早起的人确实有福了。' },
      { text: '🛏️ 再睡一会儿', effects: { energy: 15 }, flavorText: '你翻了个身，又睡了两个小时。虽然不是最健康的做法，但确实很爽。' }
    ]
  }
]
```

- [ ] **Step 1: Commit**

```bash
git add src/content/eventTexts.ts && git commit -m "feat(content): add event text pool"
```

---

### Task BE-13: 文案池 — 数值反馈与评价文案

**Files:** Create `src/content/feedbackTexts.ts` and `src/content/evaluationTexts.ts`

`src/content/feedbackTexts.ts`:

```ts
/** 心情区间 -> [描述, 视觉level] */
export const MOOD_FEEDBACK: Record<string, [string, number]> = {
  '80-100': ['心情愉悦，感觉自己是天选之子', 0],
  '50-79': ['心态平稳，问题不大', 1],
  '20-49': ['开始烦躁，想打人', 2],
  '5-19': ['emo中，生人勿近', 3],
  '0-4': ['已崩溃，建议重开', 4]
}

export const ENERGY_FEEDBACK: Record<string, [string, number]> = {
  '70-100': ['精力充沛，能跑马拉松', 0],
  '40-69': ['还行，能撑住', 1],
  '15-39': ['眼皮在打架，建议立刻找地方昏迷', 2],
  '0-14': ['随时可能猝倒，请勿操作重型机械', 3]
}

export const HUNGER_FEEDBACK: Record<string, [string, number]> = {
  '70-100': ['肚子饱饱，心满意足', 0],
  '40-69': ['微饿，但还能忍', 1],
  '15-39': ['肚子在咕咕叫，周围同学投来关切的目光', 2],
  '0-14': ['饿到产生幻觉，看什么都像鸡腿', 3]
}

export const ENTERTAINMENT_FEEDBACK: Record<string, [string, number]> = {
  '70-100': ['精神世界丰富多彩', 0],
  '40-69': ['有点无聊，但还能坐住', 1],
  '15-39': ['无聊到开始数教室里的灯管', 2],
  '0-14': ['精神枯竭，渴望任何形式的刺激', 3]
}

/** 根据数值获取区间反馈 */
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
/** 结算评语模板（每日结算随机抽取） */
export const DAILY_SETTLEMENT_FLAVORS = [
  '第{day}天结束。你还活着，这已经是一种胜利。',
  '第{day}天过去了，你离毕业又近了一步。大概。',
  '第{day}天结束了。你的大学时光又少了一天，后悔吗？',
  '第{day}天，你成功地在大学里又混了一天。',
  '一天结束！第{day}天的太阳落山了，但你的烦恼没有。',
  '第{day}天打卡完成！距离解脱还剩 {remaining} 天。'
]

/** 章节标题 */
export const PHASE_TITLES: Record<string, string> = {
  NIGHT_DECISION: '夜深了……安排明天的作战计划',
  DAWN: '凌晨时分',
  DAY_PROGRESSION: '第 {day} 天 · 课程进行中',
  DAY_SETTLEMENT: '第 {day} 天结算',
  GAME_OVER: '你倒下了……',
  GAME_WIN: '你成功毕业了！大概……'
}

/** 学分预警文案 */
export const CREDIT_WARNING = '⚠️ 教务处提醒：你的学分已进入危险区！再这样下去你可能毕不了业。'

/** 解锁家教提示 */
export const TUTOR_UNLOCK = '🎓 你的学分已达标！现在可以在非上课时间选择"做家教"赚外快了！'
```

- [ ] **Step 1: Commit**

```bash
git add src/content/feedbackTexts.ts src/content/evaluationTexts.ts
git commit -m "feat(content): add feedback and evaluation text pools"
```

---

---

## 第二部分：前端 UI 层

> **执行者：前端 ×1**
> **依赖：** 后端需先完成 Task BE-1（types.ts），其他引擎模块可并行推进。
> **原则：** UI 组件只读 Zustand store + 派发 action，不做任何游戏逻辑计算。

---

### Task FE-1: Zustand Store

**Files:** Create `src/store/gameStore.ts`

```ts
import { create } from 'zustand'
import type { GameState, GamePhase, Difficulty, DayDecision, CourseAction, DawnAction, GameEvent } from '../engine/types'
import { createInitialState, cloneState } from '../engine/state'
import { resolveCourseAction, resolveDawnAction } from '../engine/actions'
import { settleDay, applyDeltas } from '../engine/settlement'
import { evaluate, evaluateFailure } from '../engine/evaluation'
import { nextPhase } from '../engine/gameLoop'
import { findEligibleEvents, tryTriggerEvent, resolveEventOption } from '../engine/events'
import { EVENT_POOL } from '../content/eventTexts'
import { finalizeCourses } from '../engine/courseGen'
import { COURSE_NAMES } from '../content/courseNames'
import { TEACHER_NAMES } from '../content/teacherNames'

interface GameStore {
  state: GameState

  // Actions
  startGame: (difficulty: Difficulty) => void
  setDecision: (decision: DayDecision) => void
  advancePhase: () => void
  advanceCourse: () => void
  handleEventOption: (optionIndex: number) => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({

  state: createInitialState('normal'),

  startGame: (difficulty: Difficulty) => {
    const state = createInitialState(difficulty)
    // 用文案池填充课程名和老师名
    finalizeCourses(
      state.courses,
      COURSE_NAMES,
      TEACHER_NAMES,
      0,
      state.difficultyConfig
    )
    set({ state })
  },

  setDecision: (decision: DayDecision) => {
    const state = cloneState(get().state)
    state.currentDecision = decision
    state.phase = 'NIGHT_DECISION'
    set({ state })
  },

  advancePhase: () => {
    const state = cloneState(get().state)
    const currentPhase = state.phase

    // NIGHT_DECISION → DAWN
    if (currentPhase === 'NIGHT_DECISION') {
      if (!state.currentDecision) return

      // 结算凌晨行为
      const dawnResult = resolveDawnAction(state.currentDecision.dawnAction)
      state.pendingDeltas = { ...dawnResult.deltas }
      state.history.push({
        day: state.day,
        time: '凌晨',
        description: dawnResult.description,
        deltas: { ...dawnResult.deltas }
      })

      // 检测凌晨事件
      const eligible = findEligibleEvents(EVENT_POOL, state, 'dawn')
      const event = tryTriggerEvent(eligible, 0.4)
      if (event) {
        state.activeEvent = event
        state.usedEventIds.add(event.id)
        state.phase = 'DAWN_EVENT'
      } else {
        state.phase = 'DAY_PROGRESSION'
        state.courseIndex = 0
      }
    }

    // DAY_PROGRESSION → 结算课程
    else if (currentPhase === 'DAY_PROGRESSION') {
      // 已在 advanceCourse 中处理
    }

    // DAY_SETTLEMENT → 结算一天
    else if (currentPhase === 'DAY_SETTLEMENT') {
      // 已在 settleDay 中处理
    }

    set({ state })
  },

  advanceCourse: () => {
    const state = cloneState(get().state)

    if (state.phase === 'DAY_PROGRESSION' && state.courseIndex < 9 && state.currentDecision) {
      const courseIndex = state.courseIndex
      const course = state.courses[state.day - 1]?.[courseIndex]
      if (!course) return

      const action = state.currentDecision.courseActions[courseIndex]
      const skipHistoryCount = state.decisions.flatMap(d => d.courseActions).filter(a => a === 'skip').length

      const result = resolveCourseAction(action, course, state.stats, skipHistoryCount, state.difficultyConfig)

      // 累积 delta
      for (const key of Object.keys(result.deltas) as (keyof typeof result.deltas)[]) {
        const val = result.deltas[key] ?? 0
        state.pendingDeltas[key] = (state.pendingDeltas[key] ?? 0) + val
      }

      state.history.push({
        day: state.day,
        time: `第${courseIndex + 1}节课`,
        description: result.description,
        deltas: { ...result.deltas }
      })

      // 下一节或结算
      if (courseIndex >= 8) {
        // 最后一节 → 结算
        const settlement = settleDay(state)
        for (const key of Object.keys(settlement.deltas) as (keyof typeof settlement.deltas)[]) {
          const val = settlement.deltas[key] ?? 0
          state.pendingDeltas[key] = (state.pendingDeltas[key] ?? 0) + val
        }
        state.stats = applyDeltas(state.stats, state.pendingDeltas)
        state.pendingDeltas = {}

        if (settlement.gameOver) {
          state.phase = 'GAME_OVER'
        } else if (state.day >= 7) {
          state.phase = 'GAME_WIN'
        } else {
          state.phase = 'DAY_SETTLEMENT'
          state.showWarning = settlement.warningTriggered
        }
      } else {
        // 课间检测事件
        state.courseIndex = courseIndex + 1
        const eligible = findEligibleEvents(EVENT_POOL, state, 'course_break')
        const event = tryTriggerEvent(eligible, 0.3)
        if (event) {
          state.activeEvent = event
          state.usedEventIds.add(event.id)
          state.phase = 'EVENT'
        }
      }
    }

    set({ state })
  },

  handleEventOption: (optionIndex: number) => {
    const state = cloneState(get().state)
    const event = state.activeEvent
    if (!event) return

    const result = resolveEventOption(event, optionIndex)

    // 应用事件效果
    state.stats = applyDeltas(state.stats, result.effects)
    for (const key of Object.keys(result.effects) as (keyof typeof result.effects)[]) {
      const val = result.effects[key] ?? 0
      state.pendingDeltas[key] = (state.pendingDeltas[key] ?? 0) + val
    }

    state.history.push({
      day: state.day,
      time: state.phase === 'DAWN_EVENT' ? '凌晨事件' : '课间事件',
      description: result.flavorText,
      deltas: { ...result.effects }
    })

    state.activeEvent = null

    // 事件处理完毕，回归原阶段
    if (state.phase === 'DAWN_EVENT') {
      state.phase = 'DAY_PROGRESSION'
      state.courseIndex = 0
    } else if (state.phase === 'EVENT') {
      state.phase = 'DAY_PROGRESSION'
    }

    set({ state })
  },

  resetGame: () => {
    set({ state: createInitialState('normal') })
  }
}))
```

- [ ] **Step 1: Commit**

```bash
git add src/store/gameStore.ts && git commit -m "feat(store): add Zustand game store"
```

---

### Task FE-2: 三栏布局 + 状态栏

**Files:** Create `src/components/layout/GameLayout.tsx`, `src/components/status/StatusBar.tsx`, `src/components/status/StatItem.tsx`

`src/components/layout/GameLayout.tsx`:

```tsx
import { Phone } from '../phone/Phone'
import { CenterPanel } from '../center/CenterPanel'
import { StatusBar } from '../status/StatusBar'

export function GameLayout() {
  return (
    <div className="flex h-screen w-screen bg-gray-950 text-white overflow-hidden">
      {/* 左侧：模拟手机 */}
      <div className="w-72 flex-shrink-0 p-3">
        <Phone />
      </div>

      {/* 中间：核心展示区 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-w-0">
        <CenterPanel />
      </div>

      {/* 右侧：状态栏 */}
      <div className="w-56 flex-shrink-0 p-3">
        <StatusBar />
      </div>
    </div>
  )
}
```

`src/components/status/StatusBar.tsx`:

```tsx
import { useGameStore } from '../../store/gameStore'
import { StatItem } from './StatItem'
import { getFeedback, MOOD_FEEDBACK, ENERGY_FEEDBACK, HUNGER_FEEDBACK, ENTERTAINMENT_FEEDBACK } from '../../content/feedbackTexts'

export function StatusBar() {
  const stats = useGameStore(s => s.state.stats)

  const [moodText] = getFeedback(stats.mood, MOOD_FEEDBACK)
  const [energyText] = getFeedback(stats.energy, ENERGY_FEEDBACK)
  const [hungerText] = getFeedback(stats.hunger, HUNGER_FEEDBACK)
  const [entertainmentText] = getFeedback(stats.entertainment, ENTERTAINMENT_FEEDBACK)

  const items = [
    { label: '学分', value: stats.credits, max: 100, color: 'bg-amber-400', icon: '🎓' },
    { label: '心情', value: stats.mood, max: 100, color: 'bg-pink-400', icon: '💖', sub: moodText },
    { label: '精力', value: stats.energy, max: 100, color: 'bg-green-400', icon: '⚡', sub: energyText },
    { label: '饱腹', value: stats.hunger, max: 100, color: 'bg-orange-400', icon: '🍔', sub: hungerText },
    { label: '娱乐', value: stats.entertainment, max: 100, color: 'bg-purple-400', icon: '🎮', sub: entertainmentText },
    { label: '金钱', value: stats.money, max: 200, color: 'bg-yellow-400', icon: '💰', sub: `¥${stats.money}` },
    { label: '舍友', value: stats.roommateFavor, max: 100, color: 'bg-cyan-400', icon: '🏠', sub: stats.roommateFavor >= 60 ? '好兄弟' : stats.roommateFavor >= 30 ? '还行' : '紧张' }
  ]

  return (
    <div className="flex flex-col gap-2 h-full">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">📊 状态面板</h2>
      {items.map(item => (
        <StatItem key={item.label} {...item} />
      ))}
    </div>
  )
}
```

`src/components/status/StatItem.tsx`:

```tsx
import { motion } from 'framer-motion'

interface StatItemProps {
  label: string
  value: number
  max: number
  color: string
  icon: string
  sub?: string
}

export function StatItem({ label, value, max, color, icon, sub }: StatItemProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const isLow = pct < 20

  return (
    <motion.div
      className={`rounded-lg p-2 ${isLow ? 'bg-red-900/30 ring-1 ring-red-500/50' : 'bg-gray-800/50'}`}
      animate={isLow ? { x: [0, -2, 2, -2, 0] } : {}}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <div className="flex items-center gap-1 mb-1">
        <span>{icon}</span>
        <span className="text-xs font-medium text-gray-300">{label}</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-xs text-gray-500">{value}</span>
        {sub && <span className="text-xs text-gray-500 truncate ml-1">{sub}</span>}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 1: Commit**

```bash
git add src/components/layout/GameLayout.tsx src/components/status/StatusBar.tsx src/components/status/StatItem.tsx
git commit -m "feat(ui): add game layout and status bar"
```

---

### Task FE-3: 手机面板

**Files:** Create `src/components/phone/Phone.tsx`, `src/components/phone/WeChatTab.tsx`, `src/components/phone/ScheduleTab.tsx`

`src/components/phone/Phone.tsx`:

```tsx
import { useState } from 'react'
import { WeChatTab } from './WeChatTab'
import { ScheduleTab } from './ScheduleTab'

export function Phone() {
  const [tab, setTab] = useState<'wechat' | 'schedule'>('schedule')

  return (
    <div className="h-full flex flex-col rounded-3xl border-2 border-gray-600 bg-gray-900 overflow-hidden shadow-2xl">
      {/* 状态栏 */}
      <div className="bg-black/50 px-4 py-1 flex justify-between text-xs text-gray-400">
        <span>9:41</span>
        <span>📶 🔋</span>
      </div>
      {/* Tab 切换 */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setTab('wechat')}
          className={`flex-1 py-2 text-sm font-medium ${tab === 'wechat' ? 'text-green-400 border-b-2 border-green-400' : 'text-gray-500'}`}
        >
          💬 微信
        </button>
        <button
          onClick={() => setTab('schedule')}
          className={`flex-1 py-2 text-sm font-medium ${tab === 'schedule' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500'}`}
        >
          📅 课表
        </button>
      </div>
      {/* 内容 */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'wechat' ? <WeChatTab /> : <ScheduleTab />}
      </div>
    </div>
  )
}
```

`src/components/phone/WeChatTab.tsx`:

```tsx
import { useGameStore } from '../../store/gameStore'

export function WeChatTab() {
  const history = useGameStore(s => s.state.history)
  const day = useGameStore(s => s.state.day)

  // 将近期 history 条目渲染为聊天消息
  const recentMessages = history.slice(-6).reverse()

  if (recentMessages.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        暂无消息<br />
        <span className="text-xs">（等游戏开始就有消息了）</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col p-2 gap-1">
      {recentMessages.map((entry, i) => (
        <div key={i} className="bg-gray-800 rounded-lg p-2 text-xs">
          <div className="text-gray-500 mb-0.5">
            {entry.day === day ? `今天 ${entry.time}` : `第${entry.day}天 ${entry.time}`}
          </div>
          <div className="text-gray-200 leading-relaxed">{entry.description}</div>
        </div>
      ))}
    </div>
  )
}
```

`src/components/phone/ScheduleTab.tsx`:

```tsx
import { useGameStore } from '../../store/gameStore'

export function ScheduleTab() {
  const courses = useGameStore(s => s.state.courses)
  const day = useGameStore(s => s.state.day)
  const courseIndex = useGameStore(s => s.state.courseIndex)
  const phase = useGameStore(s => s.state.phase)

  const todayCourses = courses[day - 1] ?? []

  return (
    <div className="p-2">
      <div className="text-sm font-bold text-gray-300 mb-2">📅 第 {day} 天课表</div>
      {todayCourses.map((course, i) => {
        const isCurrent = phase === 'DAY_PROGRESSION' && i === courseIndex
        const isPassed = phase === 'DAY_PROGRESSION' && i < courseIndex
        return (
          <div
            key={course.id}
            className={`rounded-lg p-2 mb-1 text-xs transition-all
              ${isCurrent ? 'bg-blue-900/50 ring-1 ring-blue-400' : ''}
              ${isPassed ? 'bg-gray-800/30 opacity-50' : 'bg-gray-800/50'}
            `}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-200 truncate">{course.name}</span>
              <span className={`text-xs px-1 rounded ${course.type === 'serious' ? 'bg-red-800/50 text-red-300' : 'bg-green-800/50 text-green-300'}`}>
                {course.type === 'serious' ? '正课' : '水课'}
              </span>
            </div>
            <div className="flex justify-between mt-1 text-gray-500">
              <span>{course.teacher.name}</span>
              <span>点名: {course.estimatedRollCallProb === 'high' || course.estimatedRollCallProb === 'very_high' ? '⚠️' : '✅'} {course.estimatedRollCallProb}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 1: Commit**

```bash
git add src/components/phone/Phone.tsx src/components/phone/WeChatTab.tsx src/components/phone/ScheduleTab.tsx
git commit -m "feat(ui): add phone panel with WeChat and Schedule tabs"
```

---

### Task FE-4: 中央面板容器 + 开始画面

**Files:** Create `src/components/center/CenterPanel.tsx`, `src/components/center/StartScreen.tsx`

`src/components/center/CenterPanel.tsx`:

```tsx
import { useGameStore } from '../../store/gameStore'
import { StartScreen } from './StartScreen'
import { NightDecision } from './NightDecision'
import { DawnPhase } from './DawnPhase'
import { DayProgression } from './DayProgression'
import { EventModal } from './EventModal'
import { DaySettlement } from './DaySettlement'
import { GameOver } from './GameOver'
import { GameWin } from './GameWin'

export function CenterPanel() {
  const phase = useGameStore(s => s.state.phase)

  switch (phase) {
    case 'START':
      return <StartScreen />
    case 'NIGHT_DECISION':
      return <NightDecision />
    case 'DAWN':
    case 'DAWN_EVENT':
      return <DawnPhase />
    case 'DAY_PROGRESSION':
      return <DayProgression />
    case 'EVENT':
      return <EventModal />
    case 'DAY_SETTLEMENT':
      return <DaySettlement />
    case 'GAME_OVER':
      return <GameOver />
    case 'GAME_WIN':
      return <GameWin />
    default:
      return <StartScreen />
  }
}
```

`src/components/center/StartScreen.tsx`:

```tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import type { Difficulty } from '../../engine/types'

export function StartScreen() {
  const startGame = useGameStore(s => s.startGame)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal')

  const difficulties: { value: Difficulty; label: string; desc: string }[] = [
    { value: 'easy', label: '😎 混子模式', desc: '正课少、点名少、收益高，适合养生玩家' },
    { value: 'normal', label: '😐 正常模式', desc: '真实大学生活模拟，该来的都会来' },
    { value: 'hard', label: '💀 地狱模式', desc: '正课扎堆、点名狂魔、你不配活着毕业' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center max-w-md"
    >
      <h1 className="text-4xl font-bold mb-2">🏃 逃课模拟器</h1>
      <p className="text-gray-400 mb-6 text-sm">又名：如何在大学里优雅地混过 7 天</p>

      <div className="flex flex-col gap-2 mb-6">
        {difficulties.map(d => (
          <button
            key={d.value}
            onClick={() => setSelectedDifficulty(d.value)}
            className={`rounded-xl p-3 text-left border-2 transition-all
              ${selectedDifficulty === d.value
                ? 'border-amber-400 bg-amber-400/10'
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
              }`}
          >
            <div className="font-bold text-sm">{d.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{d.desc}</div>
          </button>
        ))}
      </div>

      <button
        onClick={() => startGame(selectedDifficulty)}
        className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-10 rounded-xl text-lg transition-all active:scale-95"
      >
        开始逃课！
      </button>
    </motion.div>
  )
}
```

- [ ] **Step 1: Commit**

```bash
git add src/components/center/CenterPanel.tsx src/components/center/StartScreen.tsx
git commit -m "feat(ui): add center panel and start screen"
```

---

### Task FE-5: 夜晚决策面板

**Files:** Create `src/components/center/NightDecision.tsx`

```tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import type { CourseAction, DawnAction } from '../../engine/types'
import { TIME_SLOTS } from '../../engine/types'

const ACTION_OPTIONS: { value: CourseAction; label: string; emoji: string }[] = [
  { value: 'attend', label: '老实上课', emoji: '📖' },
  { value: 'skip', label: '旷课跑路', emoji: '🏃' },
  { value: 'sub_for_other', label: '帮人代课', emoji: '💰' },
  { value: 'hire_sub', label: '找人代课', emoji: '🤝' }
]

const DAWN_OPTIONS: { value: DawnAction; label: string; emoji: string }[] = [
  { value: 'sleep_early', label: '早睡养生', emoji: '😴' },
  { value: 'gaming', label: '熬夜打游戏', emoji: '🎮' },
  { value: 'cram', label: '通宵赶作业', emoji: '📝' },
  { value: 'go_out', label: '出去浪', emoji: '🎉' },
  { value: 'normal_rest', label: '正常休息', emoji: '🛏️' }
]

export function NightDecision() {
  const state = useGameStore(s => s.state)
  const setDecision = useGameStore(s => s.setDecision)
  const advancePhase = useGameStore(s => s.advancePhase)

  const todayCourses = state.courses[state.day - 1] ?? []

  const [courseActions, setCourseActions] = useState<CourseAction[]>(
    new Array(9).fill('attend')
  )
  const [dawnAction, setDawnAction] = useState<DawnAction>('normal_rest')

  const handleSubmit = () => {
    setDecision({ courseActions: [...courseActions], dawnAction })
    advancePhase()
  }

  return (
    <div className="w-full max-w-2xl h-full overflow-y-auto px-4">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xl font-bold text-center mb-4"
      >
        🌙 第 {state.day} 天前夜 · 安排明日作战计划
      </motion.h2>

      <div className="space-y-3">
        {todayCourses.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-gray-800/50 rounded-lg p-3"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">
                {TIME_SLOTS[i]} · {course.name}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${course.type === 'serious' ? 'bg-red-800/50 text-red-300' : 'bg-green-800/50 text-green-300'}`}>
                {course.type === 'serious' ? '正课' : '水课'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
              <span>{course.teacher.name}（{course.teacher.trait === 'roll_call_lover' ? '爱点名' : '不爱点名'}）</span>
              <span>点名概率: {course.estimatedRollCallProb}</span>
            </div>
            <div className="flex gap-1">
              {ACTION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    const next = [...courseActions]
                    next[i] = opt.value
                    setCourseActions(next)
                  }}
                  className={`flex-1 py-1 px-1 rounded text-xs font-medium transition-all
                    ${courseActions[i] === opt.value
                      ? 'bg-amber-500 text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 凌晨行为选择 */}
      <div className="bg-gray-800/50 rounded-lg p-3 mt-3 mb-4">
        <div className="text-sm font-medium mb-2">🌙 次日凌晨行为</div>
        <div className="flex gap-1 flex-wrap">
          {DAWN_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDawnAction(opt.value)}
              className={`py-1 px-2 rounded text-xs font-medium transition-all
                ${dawnAction === opt.value
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleSubmit}
        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl text-lg mb-4"
      >
        确认！明天就这样了 🚀
      </motion.button>
    </div>
  )
}
```

- [ ] **Step 1: Commit**

```bash
git add src/components/center/NightDecision.tsx && git commit -m "feat(ui): add night decision panel"
```

---

### Task FE-6: 凌晨阶段 + 白天推进 + 事件弹窗

**Files:** Create `src/components/center/DawnPhase.tsx`, `src/components/center/DayProgression.tsx`, `src/components/center/EventModal.tsx`

`src/components/center/DawnPhase.tsx`:

```tsx
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export function DawnPhase() {
  const advancePhase = useGameStore(s => s.advancePhase)
  const phase = useGameStore(s => s.state.phase)
  const history = useGameStore(s => s.state.history)
  const lastEntry = history[history.length - 1]

  useEffect(() => {
    if (phase === 'DAWN') {
      const timer = setTimeout(() => advancePhase(), 2000)
      return () => clearTimeout(timer)
    }
  }, [phase, advancePhase])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="text-center max-w-md"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2 }}
        className="text-5xl mb-4"
      >
        🌙
      </motion.div>
      <h2 className="text-xl font-bold mb-2">凌晨时分</h2>
      {lastEntry && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-300 text-sm leading-relaxed"
        >
          {lastEntry.description}
        </motion.p>
      )}
      {phase === 'DAWN_EVENT' && (
        <p className="text-amber-400 text-xs mt-3">⚠️ 有情况发生……</p>
      )}
    </motion.div>
  )
}
```

`src/components/center/DayProgression.tsx`:

```tsx
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { TIME_SLOTS } from '../../engine/types'

export function DayProgression() {
  const day = useGameStore(s => s.state.day)
  const courseIndex = useGameStore(s => s.state.courseIndex)
  const courses = useGameStore(s => s.state.courses)
  const history = useGameStore(s => s.state.history)
  const advanceCourse = useGameStore(s => s.advanceCourse)

  const todayCourses = courses[day - 1] ?? []
  const currentCourse = todayCourses[courseIndex]
  const lastEntry = history[history.length - 1]

  useEffect(() => {
    const timer = setTimeout(() => advanceCourse(), 2500)
    return () => clearTimeout(timer)
  }, [courseIndex, day])

  return (
    <motion.div
      key={`${day}-${courseIndex}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center max-w-md"
    >
      <div className="text-gray-500 text-sm mb-2">
        第 {day} 天 · 第 {courseIndex + 1}/9 节
      </div>
      {currentCourse && (
        <div className="mb-3">
          <div className="text-lg font-bold">{currentCourse.name}</div>
          <div className="text-sm text-gray-400">
            {currentCourse.timeSlotIndex !== undefined ? TIME_SLOTS[currentCourse.timeSlotIndex] : ''} · {currentCourse.teacher.name}
          </div>
        </div>
      )}
      {lastEntry && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-200 text-sm leading-relaxed bg-gray-800/50 rounded-lg p-3"
        >
          {lastEntry.description}
        </motion.p>
      )}
    </motion.div>
  )
}
```

`src/components/center/EventModal.tsx`:

```tsx
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export function EventModal() {
  const event = useGameStore(s => s.state.activeEvent)
  const handleEventOption = useGameStore(s => s.handleEventOption)

  if (!event) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-800 border-2 border-amber-500 rounded-2xl p-6 max-w-md w-full shadow-2xl"
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-3xl text-center mb-3"
      >
        {event.phase === 'dawn' ? '🌙' : '📢'}
      </motion.div>
      <h2 className="text-lg font-bold text-amber-400 text-center mb-2">{event.title}</h2>
      <p className="text-sm text-gray-300 text-center mb-4 leading-relaxed">{event.description}</p>

      <div className="flex flex-col gap-2">
        {event.options.map((opt, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleEventOption(i)}
            className="bg-gray-700 hover:bg-gray-600 text-left text-sm text-gray-200 py-2 px-3 rounded-lg transition-colors"
          >
            {opt.text}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 1: Commit**

```bash
git add src/components/center/DawnPhase.tsx src/components/center/DayProgression.tsx src/components/center/EventModal.tsx
git commit -m "feat(ui): add dawn phase, day progression, and event modal"
```

---

### Task FE-7: 每日结算 + 通关/失败画面

**Files:** Create `src/components/center/DaySettlement.tsx`, `src/components/center/GameOver.tsx`, `src/components/center/GameWin.tsx`

`src/components/center/DaySettlement.tsx`:

```tsx
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { DAILY_SETTLEMENT_FLAVORS } from '../../content/evaluationTexts'

export function DaySettlement() {
  const day = useGameStore(s => s.state.day)
  const stats = useGameStore(s => s.state.stats)
  const showWarning = useGameStore(s => s.state.showWarning)
  const advancePhase = useGameStore(s => s.advancePhase)

  useEffect(() => {
    const timer = setTimeout(() => advancePhase(), 3000)
    return () => clearTimeout(timer)
  }, [])

  const flavor = DAILY_SETTLEMENT_FLAVORS[Math.floor(Math.random() * DAILY_SETTLEMENT_FLAVORS.length)]
    .replace('{day}', String(day))
    .replace('{remaining}', String(7 - day))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center max-w-md"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1 }}
        className="text-4xl mb-3"
      >
        📋
      </motion.div>
      <h2 className="text-xl font-bold mb-2">第 {day} 天结束</h2>
      <p className="text-gray-300 text-sm mb-4">{flavor}</p>

      {showWarning && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0, x: [0, -3, 3, -3, 0] }}
          transition={{ delay: 0.5 }}
          className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-sm text-red-300 mb-3"
        >
          ⚠️ 教务处提醒：你的学分已进入危险区！再这样下去你可能毕不了业。
        </motion.div>
      )}

      <div className="text-xs text-gray-500">
        学分: {stats.credits} | 心情: {stats.mood} | 金钱: ¥{stats.money}
      </div>
    </motion.div>
  )
}
```

`src/components/center/GameOver.tsx`:

```tsx
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { evaluateFailure } from '../../engine/evaluation'

export function GameOver() {
  const stats = useGameStore(s => s.state.stats)
  const resetGame = useGameStore(s => s.resetGame)
  const evaluation = evaluateFailure(stats)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center max-w-md"
    >
      <div className="text-6xl mb-4">💀</div>
      <h2 className="text-2xl font-bold text-red-400 mb-1">心情归零 · 精神崩坏</h2>
      <div className="text-lg font-bold text-gray-300 mb-2">{evaluation.title}</div>
      <p className="text-gray-400 text-sm mb-6">{evaluation.comment}</p>

      <button
        onClick={resetGame}
        className="bg-red-500 hover:bg-red-400 text-white font-bold py-3 px-8 rounded-xl transition-all active:scale-95"
      >
        再来一局 💪
      </button>
    </motion.div>
  )
}
```

`src/components/center/GameWin.tsx`:

```tsx
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import { evaluate } from '../../engine/evaluation'

export function GameWin() {
  const state = useGameStore(s => s.state)
  const resetGame = useGameStore(s => s.resetGame)
  const evaluation = evaluate(state)

  const ratingColors: Record<string, string> = {
    S: 'text-yellow-300',
    A: 'text-green-400',
    B: 'text-blue-400',
    C: 'text-orange-400',
    D: 'text-red-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center max-w-md"
    >
      <div className="text-5xl mb-3">🎓</div>
      <h2 className="text-2xl font-bold text-amber-400 mb-1">你毕业了！大概……</h2>
      <div className={`text-4xl font-black mb-1 ${ratingColors[evaluation.rating]}`}>
        {evaluation.rating}
      </div>
      <div className="text-xl font-bold text-gray-200 mb-1">{evaluation.title}</div>
      <p className="text-gray-400 text-sm mb-4">{evaluation.comment}</p>

      <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-500 mb-6">
        <div className="flex justify-between">
          <span>最终学分: {state.stats.credits}</span>
          <span>心情: {state.stats.mood}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>金钱: ¥{state.stats.money}</span>
          <span>舍友好感: {state.stats.roommateFavor}</span>
        </div>
      </div>

      <button
        onClick={resetGame}
        className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-xl transition-all active:scale-95"
      >
        再来一局 🔄
      </button>
    </motion.div>
  )
}
```

- [ ] **Step 1: Commit**

```bash
git add src/components/center/DaySettlement.tsx src/components/center/GameOver.tsx src/components/center/GameWin.tsx
git commit -m "feat(ui): add settlement, game over, and win screens"
```

---

### Task FE-8: 动画组件 + App 入口

**Files:** Create `src/components/shared/FlyingNumber.tsx`, `src/components/shared/ScreenEffects.tsx`
Modify `src/main.jsx` → `src/main.tsx`, `src/App.jsx` → `src/App.tsx`

`src/components/shared/ScreenEffects.tsx`:

```tsx
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export function ScreenEffects() {
  const stats = useGameStore(s => s.state.stats)
  const phase = useGameStore(s => s.state.phase)

  const isLowMood = stats.mood <= 20
  const isGameOver = phase === 'GAME_OVER'

  return (
    <AnimatePresence>
      {/* 心情极低时灰色边缘 */}
      {isLowMood && !isGameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50"
          style={{
            boxShadow: 'inset 0 0 80px 40px rgba(0,0,0,0.6)',
            background: 'transparent'
          }}
        />
      )}

      {/* 失败时红闪 */}
      {isGameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0, 0.3, 0] }}
          transition={{ duration: 1.5 }}
          className="fixed inset-0 bg-red-900 pointer-events-none z-50"
        />
      )}
    </AnimatePresence>
  )
}
```

`src/main.tsx` (from old `main.jsx`):

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx` (from old `App.jsx`):

```tsx
import { GameLayout } from './components/layout/GameLayout'
import { ScreenEffects } from './components/shared/ScreenEffects'

function App() {
  return (
    <>
      <GameLayout />
      <ScreenEffects />
    </>
  )
}

export default App
```

- [ ] **Step 1: 删除旧文件，确认编译通过**

```bash
rm -f src/main.jsx src/App.jsx
npm run build  # 确认无 TS 错误
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/ScreenEffects.tsx src/main.tsx src/App.tsx
git commit -m "feat(ui): add screen effects, wire up App entry"
```

---

---

## 开发顺序与依赖关系

```
任务依赖图（→ 表示依赖）:

BE-1 (types) ──→ BE-2 (constants) ──→ BE-4 (courseGen)
    │               │                    │
    │               └──→ BE-5 (actions) ─┘
    │                        │
    └──→ BE-7 (settlement) ──┤
    │                        │
    └──→ BE-8 (evaluation)   │
    │                        │
    └──→ BE-3 (random) ──────┘
    │
    └──→ FE-1 (store) ──→ FE-2..FE-8 (所有UI组件)

BE-6 (events) ← BE-3 (random)
BE-9 (gameLoop) ← BE-1 独立
BE-10 (state) ← BE-2, BE-4
BE-11..BE-13 (content) ← 独立，可并行
```

**推荐执行顺序：**

| 顺序 | 任务 | 执行者 | 预估 |
|------|------|--------|------|
| 1 | Task 0: 项目初始化 | 前端 | 0.5h |
| 2 | Task BE-1: 类型定义 | 后端 A+B (对齐) | 0.5h |
| 3 | Task BE-2: 常量 | 后端 A | 0.5h |
| 4 | Task BE-3: 随机工具 | 后端 B | 0.3h |
| 5 | Task BE-4: 课程生成 | 后端 A | 0.5h |
| 6 | Task BE-5: 行为结算 | 后端 A | 0.5h |
| 7 | Task BE-6: 事件系统 | 后端 B | 0.5h |
| 8 | Task BE-7: 每日结算 | 后端 B | 0.5h |
| 9 | Task BE-8: 评价系统 | 后端 B | 0.5h |
| 10 | Task BE-9: 状态机 | 后端 A | 0.3h |
| 11 | Task BE-10: 状态工厂 | 后端 A | 0.3h |
| 12 | Task BE-11..13: 文案池 | 后端 A+B 分工 | 1h |
| 13 | Task FE-1: Zustand Store | 前端 | 1h |
| 14 | Task FE-2: 布局+状态栏 | 前端 | 0.5h |
| 15 | Task FE-3: 手机面板 | 前端 | 0.5h |
| 16 | Task FE-4: 中央容器+开始 | 前端 | 0.5h |
| 17 | Task FE-5: 夜晚决策 | 前端 | 1h |
| 18 | Task FE-6: 凌晨+推进+事件 | 前端 | 1h |
| 19 | Task FE-7: 结算+通关 | 前端 | 0.5h |
| 20 | Task FE-8: 动画+入口 | 前端 | 0.5h |

**并行机会：**
- Task 0 后，后端可立即开始 BE-1
- BE-1 完成后，后端 A 和 B 可并行推进（BE-2~BE-10）
- 文案池（BE-11~13）可与引擎开发并行，后端 B 负责
- FE-1 需要等 BE-1~BE-10 基本完成后才能串起 store，但 FE-2/3 的静态 UI 可提前写

---

## 关键规则

1. **TS 严格模式**：tsconfig 已开启 `strict: true`，禁止 `any`
2. **Engine 零 React 依赖**：`src/engine/` 和 `src/content/` 不 import React 或 Zustand
3. **状态不可变**：Zustand 更新时始终通过 `cloneState()` 深拷贝
4. **所有文案从 content 获取**：组件中不硬编码任何中文文案
5. **Framer Motion**：所有动画用 `<motion.div>` 实现，不做 CSS animation
