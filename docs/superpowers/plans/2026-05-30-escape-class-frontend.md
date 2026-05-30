# 《逃课模拟器》前端开发文档

> **执行者：前端 ×1** | **预估总工时：~5.5h**
>
> **核心原则：** UI 组件只做两件事——读 Zustand store、派发 action。**绝不**在组件中写游戏逻辑计算。
>
> **依赖后端：** 需等后端完成 `src/engine/types.ts`（BE-1）后才能开始 store 开发。可以先写纯 UI 组件（布局、手机壳子）无需等待。

---

## 技术栈

| 工具 | 用途 |
|------|------|
| Vite 8 | 构建 |
| React 19 | UI |
| TypeScript 6 | 类型 |
| Zustand 5 | 状态管理（桥接 engine ↔ UI） |
| Framer Motion 12 | 所有动画（飞字/弹窗/过渡/抖动） |
| Tailwind CSS 4 | 样式（原子化 CSS，不写样式文件） |

---

## 文件结构

```
src/
├── store/
│   └── gameStore.ts           # 唯一 Zustand store
│
├── components/
│   ├── layout/
│   │   └── GameLayout.tsx     #   三栏布局
│   ├── phone/
│   │   ├── Phone.tsx          #   手机外框 + App 切换
│   │   ├── WeChatTab.tsx      #   微信消息列表
│   │   └── ScheduleTab.tsx    #   课表查看
│   ├── center/
│   │   ├── CenterPanel.tsx    #   中央区（按 phase 切换）
│   │   ├── StartScreen.tsx    #   开始画面 + 难度选择
│   │   ├── NightDecision.tsx  #   夜晚决策
│   │   ├── DawnPhase.tsx      #   凌晨结算
│   │   ├── DayProgression.tsx #   白天推进
│   │   ├── EventModal.tsx     #   事件弹窗
│   │   ├── DaySettlement.tsx  #   每日结算
│   │   ├── GameOver.tsx       #   失败画面
│   │   └── GameWin.tsx        #   通关评价
│   ├── status/
│   │   ├── StatusBar.tsx      #   状态栏容器
│   │   └── StatItem.tsx       #   单项数值条
│   └── shared/
│       └── ScreenEffects.tsx  #   屏幕特效（红闪/灰边/抖动）
│
├── App.tsx                    #   根组件
├── main.tsx                   #   Vite 入口
└── index.css                  #   Tailwind
```

---

## 项目初始化（Task 0: 前端先做）

### 0.1 安装依赖

```bash
cd D:/Hackthon/RunAwayClass
npm install zustand framer-motion
npm install -D tailwindcss @tailwindcss/vite
```

### 0.2 配置 Tailwind

修改 `vite.config.js`：

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

### 0.3 替换 `src/index.css`

```css
@import "tailwindcss";
```

### 0.4 清理旧文件

```bash
rm -f src/App.css src/pages/*.jsx src/pages/*.css src/components/Layout.jsx src/components/Navbar.jsx
rm -f src/assets/hero.png src/assets/react.svg src/assets/vite.svg
```

### 0.5 确认能跑

```bash
npm run dev
```

---

## 任务列表

### FE-1: Zustand Store `src/store/gameStore.ts`

> ⚠️ 这是前端最核心的文件。所有引擎调用、phase 流转、事件处理都在这里。

```ts
import { create } from 'zustand'
import type { GameState, Difficulty, DayDecision, CourseAction, DawnAction } from '../engine/types'
import { createInitialState, cloneState } from '../engine/state'
import { resolveCourseAction, resolveDawnAction } from '../engine/actions'
import { settleDay, applyDeltas } from '../engine/settlement'
import { evaluate, evaluateFailure } from '../engine/evaluation'
import { findEligibleEvents, tryTriggerEvent, resolveEventOption } from '../engine/events'
import { EVENT_POOL } from '../content/eventTexts'
import { finalizeCourses } from '../engine/courseGen'
import { COURSE_NAMES } from '../content/courseNames'
import { TEACHER_NAMES } from '../content/teacherNames'

interface GameStore {
  state: GameState
  startGame: (difficulty: Difficulty) => void
  setDecision: (decision: DayDecision) => void
  advancePhase: () => void
  advanceCourse: () => void
  handleEventOption: (optionIndex: number) => void
  resetGame: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({

  state: createInitialState('normal'),

  startGame: (difficulty) => {
    const state = createInitialState(difficulty)
    finalizeCourses(state.courses, COURSE_NAMES, TEACHER_NAMES, 0, state.difficultyConfig)
    set({ state })
  },

  setDecision: (decision) => {
    const state = cloneState(get().state)
    state.currentDecision = decision
    set({ state })
  },

  advancePhase: () => {
    const state = cloneState(get().state)

    if (state.phase === 'NIGHT_DECISION') {
      if (!state.currentDecision) return
      const dawnResult = resolveDawnAction(state.currentDecision.dawnAction)
      state.pendingDeltas = { ...dawnResult.deltas }
      state.history.push({
        day: state.day, time: '凌晨',
        description: dawnResult.description, deltas: { ...dawnResult.deltas }
      })
      const eligible = findEligibleEvents(EVENT_POOL, state, 'dawn')
      const event = tryTriggerEvent(eligible, 0.4)
      if (event) {
        state.activeEvent = event; state.usedEventIds.add(event.id); state.phase = 'DAWN_EVENT'
      } else {
        state.phase = 'DAY_PROGRESSION'; state.courseIndex = 0
      }
    }

    set({ state })
  },

  advanceCourse: () => {
    const state = cloneState(get().state)
    if (state.phase !== 'DAY_PROGRESSION' || state.courseIndex >= 9 || !state.currentDecision) {
      set({ state }); return
    }

    const ci = state.courseIndex
    const course = state.courses[state.day - 1]?.[ci]
    if (!course) { set({ state }); return }

    const action = state.currentDecision.courseActions[ci]
    const skipCount = state.decisions.flatMap(d => d.courseActions).filter(a => a === 'skip').length
    const result = resolveCourseAction(action, course, state.stats, skipCount, state.difficultyConfig)

    for (const key of Object.keys(result.deltas) as (keyof typeof result.deltas)[])
      state.pendingDeltas[key] = (state.pendingDeltas[key] ?? 0) + (result.deltas[key] ?? 0)

    state.history.push({
      day: state.day, time: `第${ci + 1}节课`,
      description: result.description, deltas: { ...result.deltas }
    })

    if (ci >= 8) {
      const settlement = settleDay(state)
      for (const key of Object.keys(settlement.deltas) as (keyof typeof settlement.deltas)[])
        state.pendingDeltas[key] = (state.pendingDeltas[key] ?? 0) + (settlement.deltas[key] ?? 0)
      state.stats = applyDeltas(state.stats, state.pendingDeltas)
      state.pendingDeltas = {}

      if (settlement.gameOver) state.phase = 'GAME_OVER'
      else if (state.day >= 7) state.phase = 'GAME_WIN'
      else { state.phase = 'DAY_SETTLEMENT'; state.showWarning = settlement.warningTriggered }
    } else {
      state.courseIndex = ci + 1
      const eligible = findEligibleEvents(EVENT_POOL, state, 'course_break')
      const event = tryTriggerEvent(eligible, 0.3)
      if (event) { state.activeEvent = event; state.usedEventIds.add(event.id); state.phase = 'EVENT' }
    }

    set({ state })
  },

  handleEventOption: (optionIndex) => {
    const state = cloneState(get().state)
    const event = state.activeEvent
    if (!event) { set({ state }); return }

    const result = resolveEventOption(event, optionIndex)
    state.stats = applyDeltas(state.stats, result.effects)
    for (const key of Object.keys(result.effects) as (keyof typeof result.effects)[])
      state.pendingDeltas[key] = (state.pendingDeltas[key] ?? 0) + (result.effects[key] ?? 0)

    state.history.push({
      day: state.day, time: state.phase === 'DAWN_EVENT' ? '凌晨事件' : '课间事件',
      description: result.flavorText, deltas: { ...result.effects }
    })
    state.activeEvent = null
    state.phase = (state.phase === 'DAWN_EVENT' || state.phase === 'EVENT') ? 'DAY_PROGRESSION' : state.phase
    set({ state })
  },

  resetGame: () => set({ state: createInitialState('normal') })
}))
```

---

### FE-2: 三栏布局 + 状态栏

`src/components/layout/GameLayout.tsx`:

```tsx
import { Phone } from '../phone/Phone'
import { CenterPanel } from '../center/CenterPanel'
import { StatusBar } from '../status/StatusBar'

export function GameLayout() {
  return (
    <div className="flex h-screen w-screen bg-gray-950 text-white overflow-hidden">
      <div className="w-72 flex-shrink-0 p-3"><Phone /></div>
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-w-0"><CenterPanel /></div>
      <div className="w-56 flex-shrink-0 p-3"><StatusBar /></div>
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
    { label: '舍友', value: stats.roommateFavor, max: 100, color: 'bg-cyan-400', icon: '🏠',
      sub: stats.roommateFavor >= 60 ? '好兄弟' : stats.roommateFavor >= 30 ? '还行' : '紧张' }
  ]

  return (
    <div className="flex flex-col gap-2 h-full">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">📊 状态面板</h2>
      {items.map(item => <StatItem key={item.label} {...item} />)}
    </div>
  )
}
```

`src/components/status/StatItem.tsx`:

```tsx
import { motion } from 'framer-motion'

interface Props { label: string; value: number; max: number; color: string; icon: string; sub?: string }

export function StatItem({ label, value, max, color, icon, sub }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const isLow = pct < 20

  return (
    <motion.div
      className={`rounded-lg p-2 ${isLow ? 'bg-red-900/30 ring-1 ring-red-500/50' : 'bg-gray-800/50'}`}
      animate={isLow ? { x: [0, -2, 2, -2, 0] } : {}}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <div className="flex items-center gap-1 mb-1">
        <span>{icon}</span><span className="text-xs font-medium text-gray-300">{label}</span>
      </div>
      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-xs text-gray-500">{value}</span>
        {sub && <span className="text-xs text-gray-500 truncate ml-1">{sub}</span>}
      </div>
    </motion.div>
  )
}
```

---

### FE-3: 手机面板

`src/components/phone/Phone.tsx`:

```tsx
import { useState } from 'react'
import { WeChatTab } from './WeChatTab'
import { ScheduleTab } from './ScheduleTab'

export function Phone() {
  const [tab, setTab] = useState<'wechat' | 'schedule'>('schedule')
  return (
    <div className="h-full flex flex-col rounded-3xl border-2 border-gray-600 bg-gray-900 overflow-hidden shadow-2xl">
      <div className="bg-black/50 px-4 py-1 flex justify-between text-xs text-gray-400">
        <span>9:41</span><span>📶 🔋</span>
      </div>
      <div className="flex border-b border-gray-700">
        {(['wechat', 'schedule'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium ${tab === t
              ? t === 'wechat' ? 'text-green-400 border-b-2 border-green-400' : 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-500'}`}>
            {t === 'wechat' ? '💬 微信' : '📅 课表'}
          </button>
        ))}
      </div>
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
  const recent = history.slice(-6).reverse()

  if (recent.length === 0) return (
    <div className="p-4 text-center text-gray-500 text-sm">
      暂无消息<br /><span className="text-xs">（等游戏开始就有消息了）</span>
    </div>
  )

  return (
    <div className="flex flex-col p-2 gap-1">
      {recent.map((entry, i) => (
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
          <div key={course.id}
            className={`rounded-lg p-2 mb-1 text-xs transition-all
              ${isCurrent ? 'bg-blue-900/50 ring-1 ring-blue-400' : ''}
              ${isPassed ? 'bg-gray-800/30 opacity-50' : 'bg-gray-800/50'}`}>
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

---

### FE-4: 中央面板 + 开始画面

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
    case 'START': return <StartScreen />
    case 'NIGHT_DECISION': return <NightDecision />
    case 'DAWN': case 'DAWN_EVENT': return <DawnPhase />
    case 'DAY_PROGRESSION': return <DayProgression />
    case 'EVENT': return <EventModal />
    case 'DAY_SETTLEMENT': return <DaySettlement />
    case 'GAME_OVER': return <GameOver />
    case 'GAME_WIN': return <GameWin />
    default: return <StartScreen />
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
  const [diff, setDiff] = useState<Difficulty>('normal')

  const options: { value: Difficulty; label: string; desc: string }[] = [
    { value: 'easy', label: '😎 混子模式', desc: '正课少、点名少、收益高，适合养生玩家' },
    { value: 'normal', label: '😐 正常模式', desc: '真实大学生活模拟，该来的都会来' },
    { value: 'hard', label: '💀 地狱模式', desc: '正课扎堆、点名狂魔、你不配活着毕业' }
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
      <h1 className="text-4xl font-bold mb-2">🏃 逃课模拟器</h1>
      <p className="text-gray-400 mb-6 text-sm">又名：如何在大学里优雅地混过 7 天</p>
      <div className="flex flex-col gap-2 mb-6">
        {options.map(d => (
          <button key={d.value} onClick={() => setDiff(d.value)}
            className={`rounded-xl p-3 text-left border-2 transition-all ${diff === d.value ? 'border-amber-400 bg-amber-400/10' : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'}`}>
            <div className="font-bold text-sm">{d.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{d.desc}</div>
          </button>
        ))}
      </div>
      <button onClick={() => startGame(diff)}
        className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-10 rounded-xl text-lg transition-all active:scale-95">
        开始逃课！
      </button>
    </motion.div>
  )
}
```

---

### FE-5: 夜晚决策 `src/components/center/NightDecision.tsx`

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

  const [courseActions, setCourseActions] = useState<CourseAction[]>(new Array(9).fill('attend'))
  const [dawnAction, setDawnAction] = useState<DawnAction>('normal_rest')

  const handleSubmit = () => {
    setDecision({ courseActions: [...courseActions], dawnAction })
    advancePhase()
  }

  return (
    <div className="w-full max-w-2xl h-full overflow-y-auto px-4">
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="text-xl font-bold text-center mb-4">
        🌙 第 {state.day} 天前夜 · 安排明日作战计划
      </motion.h2>

      <div className="space-y-3">
        {todayCourses.map((course, i) => (
          <motion.div key={course.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }} className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{TIME_SLOTS[i]} · {course.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${course.type === 'serious' ? 'bg-red-800/50 text-red-300' : 'bg-green-800/50 text-green-300'}`}>
                {course.type === 'serious' ? '正课' : '水课'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
              <span>{course.teacher.name}（{course.teacher.trait === 'roll_call_lover' ? '爱点名' : '不爱点名'}）</span>
              <span>点名: {course.estimatedRollCallProb}</span>
            </div>
            <div className="flex gap-1">
              {ACTION_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => { const next = [...courseActions]; next[i] = opt.value; setCourseActions(next) }}
                  className={`flex-1 py-1 px-1 rounded text-xs font-medium transition-all
                    ${courseActions[i] === opt.value ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 凌晨行为 */}
      <div className="bg-gray-800/50 rounded-lg p-3 mt-3 mb-4">
        <div className="text-sm font-medium mb-2">🌙 次日凌晨行为</div>
        <div className="flex gap-1 flex-wrap">
          {DAWN_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setDawnAction(opt.value)}
              className={`py-1 px-2 rounded text-xs font-medium transition-all
                ${dawnAction === opt.value ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit}
        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl text-lg mb-4">
        确认！明天就这样了 🚀
      </motion.button>
    </div>
  )
}
```

---

### FE-6: 凌晨 + 白天推进 + 事件弹窗

`src/components/center/DawnPhase.tsx`:

```tsx
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'

export function DawnPhase() {
  const advancePhase = useGameStore(s => s.advancePhase)
  const phase = useGameStore(s => s.state.phase)
  const lastEntry = useGameStore(s => s.state.history).slice(-1)[0]

  useEffect(() => {
    if (phase === 'DAWN') { const t = setTimeout(() => advancePhase(), 2000); return () => clearTimeout(t) }
  }, [phase, advancePhase])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-md">
      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2 }} className="text-5xl mb-4">🌙</motion.div>
      <h2 className="text-xl font-bold mb-2">凌晨时分</h2>
      {lastEntry && (
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-gray-300 text-sm leading-relaxed">{lastEntry.description}</motion.p>
      )}
      {phase === 'DAWN_EVENT' && <p className="text-amber-400 text-xs mt-3">⚠️ 有情况发生……</p>}
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
    const t = setTimeout(() => advanceCourse(), 2500); return () => clearTimeout(t)
  }, [courseIndex, day])

  return (
    <motion.div key={`${day}-${courseIndex}`} initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
      <div className="text-gray-500 text-sm mb-2">第 {day} 天 · 第 {courseIndex + 1}/9 节</div>
      {currentCourse && (
        <div className="mb-3">
          <div className="text-lg font-bold">{currentCourse.name}</div>
          <div className="text-sm text-gray-400">
            {TIME_SLOTS[currentCourse.timeSlotIndex]} · {currentCourse.teacher.name}
          </div>
        </div>
      )}
      {lastEntry && (
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="text-gray-200 text-sm leading-relaxed bg-gray-800/50 rounded-lg p-3">{lastEntry.description}</motion.p>
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
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-800 border-2 border-amber-500 rounded-2xl p-6 max-w-md w-full shadow-2xl">
      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-3xl text-center mb-3">{event.phase === 'dawn' ? '🌙' : '📢'}</motion.div>
      <h2 className="text-lg font-bold text-amber-400 text-center mb-2">{event.title}</h2>
      <p className="text-sm text-gray-300 text-center mb-4 leading-relaxed">{event.description}</p>
      <div className="flex flex-col gap-2">
        {event.options.map((opt, i) => (
          <motion.button key={i} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => handleEventOption(i)}
            className="bg-gray-700 hover:bg-gray-600 text-left text-sm text-gray-200 py-2 px-3 rounded-lg transition-colors">
            {opt.text}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
```

---

### FE-7: 每日结算 + 通关/失败

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

  useEffect(() => { const t = setTimeout(() => advancePhase(), 3000); return () => clearTimeout(t) }, [])

  const flavor = DAILY_SETTLEMENT_FLAVORS[Math.floor(Math.random() * DAILY_SETTLEMENT_FLAVORS.length)]
    .replace('{day}', String(day)).replace('{remaining}', String(7 - day))

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1 }} className="text-4xl mb-3">📋</motion.div>
      <h2 className="text-xl font-bold mb-2">第 {day} 天结束</h2>
      <p className="text-gray-300 text-sm mb-4">{flavor}</p>
      {showWarning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, x: [0, -3, 3, -3, 0] }}
          transition={{ delay: 0.5 }} className="bg-red-900/50 border border-red-500 rounded-lg p-3 text-sm text-red-300 mb-3">
          ⚠️ 教务处提醒：你的学分已进入危险区！
        </motion.div>
      )}
      <div className="text-xs text-gray-500">学分: {stats.credits} | 心情: {stats.mood} | 金钱: ¥{stats.money}</div>
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
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
      <div className="text-6xl mb-4">💀</div>
      <h2 className="text-2xl font-bold text-red-400 mb-1">心情归零 · 精神崩坏</h2>
      <div className="text-lg font-bold text-gray-300 mb-2">{evaluation.title}</div>
      <p className="text-gray-400 text-sm mb-6">{evaluation.comment}</p>
      <button onClick={resetGame}
        className="bg-red-500 hover:bg-red-400 text-white font-bold py-3 px-8 rounded-xl transition-all active:scale-95">
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

const RATING_COLORS: Record<string, string> = { S: 'text-yellow-300', A: 'text-green-400', B: 'text-blue-400', C: 'text-orange-400', D: 'text-red-400' }

export function GameWin() {
  const state = useGameStore(s => s.state)
  const resetGame = useGameStore(s => s.resetGame)
  const evaluation = evaluate(state)

  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
      <div className="text-5xl mb-3">🎓</div>
      <h2 className="text-2xl font-bold text-amber-400 mb-1">你毕业了！大概……</h2>
      <div className={`text-4xl font-black mb-1 ${RATING_COLORS[evaluation.rating]}`}>{evaluation.rating}</div>
      <div className="text-xl font-bold text-gray-200 mb-1">{evaluation.title}</div>
      <p className="text-gray-400 text-sm mb-4">{evaluation.comment}</p>
      <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-500 mb-6">
        <div className="flex justify-between"><span>最终学分: {state.stats.credits}</span><span>心情: {state.stats.mood}</span></div>
        <div className="flex justify-between mt-1"><span>金钱: ¥{state.stats.money}</span><span>舍友好感: {state.stats.roommateFavor}</span></div>
      </div>
      <button onClick={resetGame}
        className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-xl transition-all active:scale-95">
        再来一局 🔄
      </button>
    </motion.div>
  )
}
```

---

### FE-8: 屏幕特效 + App 入口

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
      {isLowMood && !isGameOver && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50"
          style={{ boxShadow: 'inset 0 0 80px 40px rgba(0,0,0,0.6)' }} />
      )}
      {isGameOver && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.5, 0, 0.3, 0] }}
          transition={{ duration: 1.5 }} className="fixed inset-0 bg-red-900 pointer-events-none z-50" />
      )}
    </AnimatePresence>
  )
}
```

`src/App.tsx`（替换旧的 `App.jsx`）:

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

`src/main.tsx`（替换旧的 `main.jsx`）:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
```

**清理旧文件并验证：**

```bash
rm -f src/main.jsx src/App.jsx
npm run build  # 确认无 TS 错误
```

---

## 执行顺序

| 序号 | 任务 | 可并行 | 预估 |
|------|------|--------|------|
| 0 | 项目初始化 | - | 0.5h |
| 1 | FE-2 布局+状态栏 | 是（静态 UI，不依赖 store） | 0.5h |
| 2 | FE-3 手机面板 | 是（静态 UI） | 0.5h |
| 3 | FE-1 Zustand Store | 需等 BE-1 types 完成 | 1h |
| 4 | FE-4 中央容器+开始画面 | - | 0.5h |
| 5 | FE-5 夜晚决策 | - | 1h |
| 6 | FE-6 凌晨+推进+事件 | - | 1h |
| 7 | FE-7 结算+通关 | - | 0.5h |
| 8 | FE-8 特效+入口 | - | 0.5h |

**策略：** 在等后端 types.ts 期间，先完成 FE-2（布局）、FE-3（手机面板）这两个纯静态组件。FE-4 的开始画面也只需 store 的 `startGame` 接口，可以先写骨架。
