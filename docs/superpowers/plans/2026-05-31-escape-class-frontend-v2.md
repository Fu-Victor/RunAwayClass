# 《逃课模拟器》前端开发文档（重写版）

> **版本：v2.0 | 日期：2026-05-31 | 状态：增量改进**
>
> **核心原则：沿用现有实现风格，零框架引入，在现有画面上修改。**

---

## 一、当前前端架构（实际实现，非计划）

### 技术栈

| 工具 | 用途 |
|------|------|
| Vite 8 | 构建 |
| React 19 | UI |
| React Router 7 | 路由 |
| React Context + useReducer | 状态管理 |
| Plain CSS（CSS Variables） | 样式 |
| CSS keyframes | 动画 |
| js-yaml | YAML 文案解析 |

**未使用且不计划引入：** Zustand、Framer Motion、Tailwind CSS

### 文件结构（现有）

```
src/
├── main.jsx                          # Vite 入口
├── App.jsx                           # 路由
├── index.css                         # 全局样式（~80行）
│
├── pages/
│   ├── Game.jsx                      # 主游戏画面（612行，含全部 UI 组件）
│   └── Game.css                      # 游戏样式表（CSS Variables 体系）
│
├── store/
│   └── gameStore.jsx                 # Context + useReducer（586行）
│       ├── GameProvider              # 状态提供者
│       ├── useGame()                 # 消费 hook
│       ├── gameReducer              # 纯函数 reducer
│       ├── COURSE_ACTIONS            # UI 行为定义（8种）
│       ├── FREE_ACTIONS / DAWN_ACTIONS
│       └── UI_TO_ENGINE 映射        # 前端行为 → engine CourseAction
│
├── utils/
│   └── gameHelpers.js               # statMeta / 区间文案 / 心理描述 / 阈值预警
│
├── engine/                           # 纯 TS 引擎（零 React 依赖）
│   └── ...                           # 11 文件，前端通过 gameStore 桥接
│
└── content/                          # YAML 数据驱动文案
    └── ...                           # 7 YAML + loader.ts
```

### 数据流

```
YAML 文案 → loader.ts → engine 函数
                              ↓
User Click → gameStore.dispatch → gameReducer → engine 函数调用
                              ↓
                         new State → Context → UI re-render
```

### 已实现功能清单

| 功能 | 状态 | 实现位置 |
|------|------|---------|
| 三栏布局（手机+中央+状态栏） | ✅ | `Game.jsx` — `GameBoard` |
| 左侧手机外框 | ✅ | `Game.jsx` — `PhoneFrame` |
| 手机微信页（消息列表+详情） | ✅ | `Game.jsx` — phoneTab === 'messages' |
| 手机课表页（按早/中/晚分组） | ✅ | `Game.jsx` — phoneTab === 'schedule' |
| 夜晚决策（选行为+凌晨行为） | ✅ | `Game.jsx` — `NightPhaseCenter` |
| 凌晨行为结算 | ✅ | `gameStore.jsx` — `SUBMIT_NIGHT` |
| 白天课程推进（逐节） | ✅ | `Game.jsx` — `DayPhaseCenter` |
| 课程结果展示（数值变动+警告） | ✅ | `Game.jsx` — `DayPhaseCenter` |
| 课间事件弹窗 | ✅ | `Game.jsx` — `EventPanel` |
| 事件选项结算 | ✅ | `gameStore.jsx` — `RESOLVE_EVENT` |
| 每日结算 | ✅ | `Game.jsx` — `SettlementPhase` |
| 通关/失败评价 | ✅ | `Game.jsx` — `ResultScreen` |
| 难度选择 | ✅ | `Game.jsx` — `DifficultyScreen` |
| 右侧状态栏（7维数值+进度条） | ✅ | `Game.jsx` — `SideStatus` |
| 区间文案反馈 | ✅ | `gameHelpers.js` → `getStatDescription` |
| 阈值预警（学分/精力/饱腹） | ✅ | `Game.jsx` — `ThresholdAlerts` |
| 底部控制台（buff/debuff+日志） | ✅ | `Game.jsx` — `BottomConsole` |
| 心理描述（夜晚决策前） | ✅ | `gameHelpers.js` → `getNightMindset` |
| 累计旷课风险提示 | ✅ | `Game.jsx` — `NightPhaseCenter` |
| 数值变动飞字（+N/-N） | ✅ | `Game.jsx` — `.delta-item` |
| 点名/睡着/玩手机警告 | ✅ | `Game.jsx` — `.result-alert` |
| 屏幕红闪效果 | ✅ | CSS `.danger-mood` |
| 空闲时段处理 | ✅ | `FREE_ACTIONS` + `isFree` 标记 |

---

## 二、旧计划的三大问题

旧前端计划（2026-05-30-escape-class-frontend.md）存在以下问题：

1. **框架过度引入** — 计划引入 Zustand（状态管理）、Framer Motion（动画）、Tailwind CSS（样式），但项目实际并未安装这些依赖。强行引入意味着推翻现有全部代码重写。

2. **组件拆分过细** — 计划将 Game.jsx 拆成 14+ 个独立文件（`NightDecision.tsx`、`DayProgression.tsx`、`EventModal.tsx`…），但现有 Game.jsx 中组件通过共享 `useGame()` hook 高效协作，拆分后反而增加 prop drilling 或导入复杂度。

3. **与现有风格断裂** — 现有 CSS 体系用 CSS Variables（`--paper`、`--ink`、`--red` 等）实现了一套干净的"微信质感+红笔批改"风格，突然换成 Tailwind 会破坏视觉一致性。

---

## 三、增量改进计划（替代旧计划）

### 改进原则

- **不动架构**：保持 Context + useReducer + Plain CSS
- **不装新依赖**：不引入 Zustand / Framer Motion / Tailwind
- **在现有代码上改**：Game.jsx 保持单文件组件，仅在文件过长时做内聚拆分
- **先补缺后优化**：先补缺失功能，再做体验打磨

### 3.1 缺失功能补全（P0 — 必须）

| # | 功能 | 当前状态 | 改动方案 |
|---|------|---------|---------|
| 1 | **凌晨事件弹窗** | 凌晨行为结算后直接跳到白天，没有展示凌晨事件 | 在 `SUBMIT_NIGHT` 和 `DAY_PROGRESSION` 之间插入 dawn event 检测，复用 `EventPanel` |
| 2 | **点名概率实时更新** | 课表页中概率标签只在进入夜晚时计算一次 | 每次 `setCoursePlan` 后重新跑 `getEstimatedProbLabel()`，让概率标签动态反映累计风险 |
| 3 | **学分不足时的行为锁定** | UI 中家教/找人代课已有条件禁用，但提示不够明显 | 在禁用按钮上加 tooltip 说明解锁条件 |
| 4 | **结算文案接入引擎** | SettlementPhase 使用硬编码文案 | 改为调用 `settlementTexts`（已导入但未使用） |

### 3.2 体验优化（P1 — 建议）

| # | 优化点 | 方案 |
|---|--------|------|
| 5 | **课程结果数值动画** | 现有 `+N/-N` 飞字已有 CSS 实现，增加 `@keyframes floatUp` 让飞字上飘消失 |
| 6 | **心情极低屏幕灰度** | 已有 `.danger-mood` 类，增强为边缘渐灰（`box-shadow: inset 0 0 60px rgba(0,0,0,0.3)`） |
| 7 | **点名红闪** | CSS `@keyframes redFlash`：0.3s 红色半透明遮罩 |
| 8 | **课间事件触发时的微交互** | 事件弹窗加 `scale(0.9)→scale(1)` 弹入动画（纯 CSS） |
| 9 | **手机消息与事件联动** | 当事件触发时，在手机微信页插入一条关联消息 |
| 10 | **历史日志展示改进** | 底部控制台点击展开最近 5 条日志（当前只显示最新 1 条） |

### 3.3 架构优化（P2 — 可选）

| # | 优化点 | 方案 |
|---|--------|------|
| 11 | **Game.jsx 适度拆分** | 当文件超过 800 行时，将 `PhoneFrame` 和 `SideStatus` 抽出为独立文件。其余组件保持在同一文件中（它们通过闭包共享 useGame）。 |
| 12 | **gameStore.jsx 清理** | `UI_TO_ENGINE` 映射中的 `fun`/`sleep`/`meal`/`work`/`tutor` 是 UI 层特有行为，统一收口到 `gameHelpers.js` |

---

## 四、关键改动详解

### 4.1 凌晨事件支持（#1）

当前流程：
```
SUBMIT_NIGHT → resolveDawnAction → 直接进入 DAY_PROGRESSION
```

改为：
```
SUBMIT_NIGHT → resolveDawnAction → findEligibleEvents(dawn) 
    → 有匹配事件 → 展示 EventPanel → 玩家选完 → DAY_PROGRESSION
    → 无匹配事件 → DAY_PROGRESSION
```

**gameStore.jsx 改动：**
```javascript
case 'SUBMIT_NIGHT': {
  // ... 现有黎明结算逻辑 ...
  // 新增：检测凌晨事件
  const es = buildEngineState({ ...state, currentCourse: 0 })
  const dawnEligible = findEligibleEvents(eventPool, es, 'dawn')
  const dawnPicked = tryTriggerEvent(dawnEligible)
  if (dawnPicked) {
    return {
      ...state,
      stats: nextStats,
      phase: PHASES.DAY, // 复用 DAY phase
      currentEvent: dawnPicked,
      usedEventIds: [...state.usedEventIds, dawnPicked.id],
      history: [dawnResult.description, ...state.history].slice(0, 8),
    }
  }
  // ... 否则直接进入 DAY ...
}
```

**Game.jsx 改动：** 无需改动 — `EventPanel` 已在 DAY phase 下渲染，凌晨事件弹窗自然展示。

### 4.2 点名概率动态更新（#2）

**gameStore.jsx 改动：** 无需改动 store。概率计算发生在 `coursesWithEstimate`（useMemo），依赖 `state.skipCount`。当前 `SET_COURSE_PLAN` 不改变 skipCount，但 `ADVANCE_COURSE` 会改变。概率标签在白天推进时自然会更新。

额外优化：在 `coursesWithEstimate` 中增加对当前决策的感知——选中旷课后，该课程的概率标签变红高亮。

### 4.3 结算文案引擎化（#4）

当前 `SettlementPhase` 硬编码：
```jsx
const dailyText = stats.mood < 40 ? '今天有点惨…' : stats.mood > 70 ? '今天过得不错…' : '今天就这样吧…'
```

改为从 engine 的 settlement 结果获取 `description`。`settleDay()` 返回值已经包含 `description` 字段（来自 `settlementTexts.yaml`），只需传递到 UI。

### 4.4 CSS 动画增强（#5-#8）

全部用纯 CSS 实现，不引入 JS 动画库：

```css
/* 飞字上飘 */
@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-24px); }
}
.delta-item { animation: floatUp 1.5s ease-out forwards; }

/* 点名红闪 */
@keyframes redFlash {
  0%, 100% { box-shadow: none; }
  50% { box-shadow: inset 0 0 80px rgba(231, 76, 60, 0.5); }
}
.game-shell.roll-called { animation: redFlash 0.6s ease-out; }

/* 事件弹入 */
@keyframes popIn {
  0% { transform: scale(0.85); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.event-center-card { animation: popIn 0.25s ease-out; }
```

---

## 五、不改动的边界

以下内容明确**不做**（防范围蔓延）：

- ❌ 不引入 Zustand 替代 Context+useReducer
- ❌ 不引入 Framer Motion 替代 CSS 动画
- ❌ 不引入 Tailwind CSS 覆盖现有 CSS Variables 体系
- ❌ 不将 Game.jsx 拆为 14+ 个文件
- ❌ 不重写 gameStore 为多个 slice
- ❌ 不添加 TypeScript 到前端组件（保留 .jsx，engine 层已是 TS）

---

## 六、执行顺序

| 优先级 | 步骤 | 预估 | 涉及文件 |
|--------|------|------|---------|
| P0 | 凌晨事件弹窗 | 0.5h | gameStore.jsx |
| P0 | 结算文案引擎化 | 0.5h | Game.jsx + gameStore.jsx |
| P0 | 学分不足提示优化 | 0.25h | Game.jsx |
| P1 | CSS 动画增强（飞字/红闪/弹入/灰度） | 1h | Game.css |
| P1 | 历史日志展示改进 | 0.5h | Game.jsx |
| P1 | 手机消息与事件联动 | 0.5h | gameStore.jsx + Game.jsx |
| P2 | 适度拆分 Game.jsx | 0.5h | 新建 2 个组件文件 |
| P2 | UI_TO_ENGINE 收口清理 | 0.25h | gameHelpers.js |

**总预估：约 4h**（vs 旧计划 5.5h 且需要全部重写）

---

## 七、与后端引擎的对接

对接方式与旧计划一致，但实际已实现：

```javascript
// gameStore.jsx 已有的引擎导入（无需改动）
import { createInitialState } from '../engine/state'
import { resolveCourseAction, resolveDawnAction, resolveFreeSlotAction } from '../engine/actions'
import { findEligibleEvents, tryTriggerEvent, resolveEventOption } from '../engine/events'
import { settleDay, applyDeltas } from '../engine/settlement'
import { evaluate, evaluateFailure } from '../engine/evaluation'
import { finalizeCourses, getEstimatedProbLabel } from '../engine/courseGen'
import { eventPool, courseNames, teacherNames, actionTexts, settlementTexts } from '../content/loader'
```

**注意：** `resolveEventOption` 在本次后端改动中新增了 `action` 参数。`gameStore.jsx` 第 381 行的调用需更新为 `resolveEventOption(event, optionIndex, uiActionKey)`。

---

> **与旧计划的关系：** 本文档替代 `docs/superpowers/plans/2026-05-30-escape-class-frontend.md`，后者描述的 Zustand + Framer Motion + Tailwind 架构不再适用。
