# 《逃课模拟器》前端开发文档

> **执行者：前端 ×1** | **预估总工时：~5.5h**
>
> **核心原则：** UI 组件只做两件事——读 Zustand store、派发 action。**绝不**在组件中写游戏逻辑计算。
>
> **依赖后端：** 后端引擎层已完成（11 文件 + 7 YAML 配置 + 109 tests），可直接 import 使用。

---

## 技术栈

| 工具 | 用途 |
|------|------|
| Vite 8 | 构建 |
| React 19 | UI |
| TypeScript 6 | 类型 |
| Zustand 5 | 状态管理（桥接 engine ↔ UI） |
| Framer Motion 12 | 所有动画（飞字/弹窗/过渡/抖动） |
| Tailwind CSS 4 | 样式 |

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
│   │   ├── NightDecision.tsx  #   夜晚决策（课程时段 + 空闲时段 + 凌晨行为）
│   │   ├── DawnPhase.tsx      #   凌晨结算
│   │   ├── DayProgression.tsx #   白天推进
│   │   ├── EventModal.tsx     #   事件弹窗
│   │   ├── DaySettlement.tsx  #   每日结算
│   │   ├── GameOver.tsx       #   失败画面
│   │   └── GameWin.tsx        #   通关评价
│   ├── status/
│   │   ├── StatusBar.tsx      #   状态栏容器
│   │   └── StatItem.tsx       #   单项数值条（含进度条 + 抖动警告）
│   └── shared/
│       └── ScreenEffects.tsx  #   屏幕特效（红闪/灰边）
│
├── App.tsx                    #   根组件
├── main.tsx                   #   Vite 入口
└── index.css                  #   Tailwind
```

---

## 关键对接 API

### Store 需要调用的 engine 函数

```ts
// 初始化
import { createInitialState } from '../engine/state'
import { finalizeCourses } from '../engine/courseGen'
import { courseNames, teacherNames } from '../content/loader'

// 行为结算
import { resolveCourseAction, resolveDawnAction, resolveFreeSlotAction } from '../engine/actions'
import { settleDay, applyDeltas } from '../engine/settlement'
import { evaluate, evaluateFailure } from '../engine/evaluation'

// 事件系统
import { findEligibleEvents, tryTriggerEvent, resolveEventOption } from '../engine/events'
import { eventPool } from '../content/loader'

// 点名概率
import { getEstimatedProbLabel } from '../engine/courseGen'
```

### 重要类型变更（与原计划不同）

1. `courses: (Course | null)[][]` — null 表示空闲时段，UI 需展示不同选项
2. `DayDecision` 含 `courseActions` 和 `freeActions` 两个长度为 9 的数组
3. `FreeAction = 'self_study' | 'rest' | 'eat' | 'entertain'` — 空闲时段四种行为
4. `Course` 上无 `estimatedRollCallProb` 字段 — 用 `getEstimatedProbLabel()` 实时获取
5. `usedEventIds` 是 `string[]`（非 `Set<string>`）
6. `DifficultyConfig` 有 `courseDensity` 字段
7. `GameEvent.condition` 是 DSL 字符串（非 `triggerCondition`）
8. `createDayDecision(courseActions, freeActions, dawnAction, slotCount)` — 需传四个参数
9. 所有文案从 `loader.ts` 获取，不在组件中硬编码

### NightDecision 组件需要处理

决策面板需区分课程时段和空闲时段：
- 课程时段：展示课程卡片 + 四种课程行为按钮（上课/旷课/帮人代课/找人代课）
- 空闲时段：展示空闲标签 + 四种空闲行为按钮（自习/补觉/吃饭/摸鱼）
- 点名概率仅课程时段展示
- 底部凌晨行为选择区不变

---

## 执行顺序

| 序号 | 任务 | 预估 |
|------|------|------|
| 0 | 项目初始化（依赖安装 + Tailwind 配置 + 旧文件清理） | 0.5h |
| 1 | 布局 + 状态栏（纯静态 UI，不依赖 store） | 0.5h |
| 2 | 手机面板（静态 UI） | 0.5h |
| 3 | Zustand Store（桥接 engine 全部 API） | 1h |
| 4 | 中央容器 + 开始画面 | 0.5h |
| 5 | 夜晚决策（含空闲时段区分） | 1h |
| 6 | 凌晨 + 白天推进 + 事件弹窗 | 1h |
| 7 | 结算 + 通关/失败画面 | 0.5h |
| 8 | 屏幕特效 + App 入口 | 0.5h |
