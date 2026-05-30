# 《逃课模拟器》后端开发文档

> **状态：引擎层已完成 | 最后更新：2026-05-30**
>
> **核心原则：** `src/engine/` 和 `src/content/` 中所有代码零 React 依赖。纯 TS 实现，可脱离浏览器用 Node 跑测试。

---

## 当前文件结构

```
src/
├── engine/                        # 纯 TS 游戏逻辑（零 React 依赖）
│   ├── types.ts                   #   所有类型定义（全项目基石）
│   ├── constants.ts               #   常量（三档难度配置、行为数值表、点名因子、TIME_SLOTS）
│   ├── state.ts                   #   初始状态工厂 + structuredClone 深拷贝
│   ├── random.ts                  #   随机工具（chance/pick/shuffle/weightedPick/clamp/probLabel）
│   ├── conditionEval.ts           #   条件表达式求值器（parseCondition — 供 events + evaluation 共用）
│   ├── courseGen.ts               #   课程按 density 随机生成 + 点名概率计算（空闲时段为 null）
│   ├── actions.ts                 #   行为结算（4种课程行为 + 5种凌晨行为 + 4种空闲时段行为）
│   ├── events.ts                  #   事件筛选匹配 + 数据驱动触发判定 + 选项结算
│   ├── settlement.ts              #   每日结算（自然衰减 + 心情联动 + 阈值检测 + clamp）
│   ├── evaluation.ts              #   六维加权评分 + S~D 评级 + 称号匹配
│   ├── gameLoop.ts                #   状态机流转（9 个 phase + 自动推进时长）
│   └── __tests__/                 #   单元测试（10 文件 109 tests）
│
└── content/                       # YAML 数据驱动配置（策划可直接编辑）
    ├── loader.ts                  #   js-yaml 解析 + Vite ?raw 导入 + 类型化导出
    ├── types.ts                   #   配置类型（ActionTexts/SettlementTexts/EvaluationTexts 等）
    ├── vite-env.d.ts              #   .yaml?raw 模块声明
    ├── actionTexts.yaml           #   课程行为 + 凌晨行为 + 空闲行为文案
    ├── settlementTexts.yaml       #   每日结算文案
    ├── evaluationTexts.yaml       #   评价称号池（S~D + fallback + 失败评价）
    ├── courseNames.yaml           #   课程名池（34 条）
    ├── teacherNames.yaml          #   老师名池（点名狂魔/佛系各 10 条）
    ├── feedbackTexts.yaml         #   数值区间反馈（心情/精力/饱腹/娱乐）
    └── eventTexts.yaml            #   事件池（10 个事件，condition DSL 数据驱动）
```

---

## 架构关键决策

### 文案外置：YAML + loader

所有玩家可见文案均存储在 `.yaml` 文件中，通过 `loader.ts` 统一解析和类型化导出。engine 层通过 `import { xxx } from '../content/loader'` 获取文案，零硬编码。

```
YAML 文件 → Vite ?raw 导入 → js-yaml 解析 → loader.ts 导出 → engine 消费
```

### 条件表达式 DSL

`conditionEval.ts` 的 `parseCondition()` 是 events 和 evaluation 的共用条件求值引擎：
- 支持 `and/or` 逻辑组合、`>= <= > < == !=` 比较运算符
- 支持数字和字符串两种值类型
- 未知变量 `console.warn` 而非静默失败
- events.ts 的 `buildTriggerCtx` 和 evaluation.ts 的 `matchTitle` 均调用它

### 课程分布系统

- `DifficultyConfig.courseDensity`：easy 0.55 / normal 0.75 / hard 1.0
- `courses: (Course | null)[][]`：null 表示空闲时段
- 空闲时段行为（`FreeAction`）：自习/补觉/吃饭/摸鱼，不受 `rewardMultiplier` 影响
- 出勤率统计仅计入有课时段

### 点名概率实时计算

`Course` 上不缓存 `estimatedRollCallProb`。`getEstimatedProbLabel()` 每次基于实时 `skipHistoryCount` 计算，杜绝快照过期。

### 测试

`npx vitest run` — 10 文件 109 tests，覆盖 random / conditionEval / constants / courseGen / actions / events / settlement / evaluation / state / gameLoop。

---

## 已完成的 BE 任务

| 任务 | 文件 | 状态 |
|------|------|------|
| BE-1 | types.ts | ✅ 含 FreeAction / courseDensity / nullable courses |
| BE-2 | constants.ts | ✅ 三档难度 + FREE_SLOT_EFFECTS + GO_OUT_ROOMMATE_DELTA |
| BE-3 | random.ts | ✅ 全部工具函数含边界抛错 |
| - | conditionEval.ts | ✅ 审计新增，共享 DSL 求值器 |
| BE-4 | courseGen.ts | ✅ 按 density 生成 + 空闲时段 + 实时点名概率 |
| BE-5 | actions.ts | ✅ 课程/凌晨/空闲三种行为结算 |
| BE-6 | events.ts | ✅ 数据驱动触发 + eventPositiveBias 接入 |
| BE-7 | settlement.ts | ✅ 心情联动 + clamp + 自然衰减 |
| BE-8 | evaluation.ts | ✅ 六维加权 + 称号匹配 |
| BE-9 | gameLoop.ts | ✅ 9 phase 状态机 |
| BE-10 | state.ts | ✅ 初始工厂 + structuredClone |
| BE-11 | courseNames.yaml + teacherNames.yaml | ✅ |
| BE-12 | eventTexts.yaml | ✅ 从 TS 硬编码迁移到 YAML |
| BE-13 | feedbackTexts.yaml | ✅ |

---

## 待前端对接的关键接口

| 接口 | 说明 |
|------|------|
| `createInitialState(difficulty)` | 创建新游戏，需传入难度 |
| `GameState.courses[day][slot]` | `Course \| null`，null 时空闲时段 UI 需展示不同选项 |
| `DayDecision.courseActions` + `freeActions` | 两个长度为 9 的数组，分别对应课程和空闲时段 |
| `GameState.phase` | 驱动中央面板组件切换 |
| `getEstimatedProbLabel(course, skipCount, config)` | 获取实时点名概率标签 |
| `evaluate(state)` / `evaluateFailure(stats)` | 结算评价 |
| `resolveCourseAction / resolveDawnAction / resolveFreeSlotAction` | 行为结算（store 中调用） |
| `findEligibleEvents / tryTriggerEvent / resolveEventOption` | 事件系统（store 中调用） |
| `settleDay / applyDeltas` | 每日结算（store 中调用） |
| `createDayDecision` | 工厂函数，校验 actions 长度 |
