# 《逃课模拟器》实现计划（总控）

> **状态：后端完成，前端待开工 | 最后更新：2026-05-30**

**Goal:** 从零构建"逃课模拟器"网页游戏——纯 TS 游戏引擎 + React 画面层

**Architecture:** 纯 TS 引擎层（零 React 依赖）+ YAML 数据驱动文案 + Zustand 桥接 + React + Framer Motion + Tailwind 画面层

**Tech Stack:** Vite 8 + React 19 + TypeScript 6 + Zustand 5 + Framer Motion 12 + Tailwind CSS 4 + js-yaml + Vitest

**团队分工:**
- **前端 ×1**：React 组件、动画、Zustand store 桥接、Tailwind 样式
- **后端 ×2**：纯 TS 引擎 + 全部 YAML 文案配置 + 单元测试

---

## 当前进度

```
引擎层 (11 files)     ✅  109 tests 全部通过
内容层 (7 YAML + TS)   ✅  全部文案已填充
前端层                 ⬜  待开工
```

### 引擎文件清单

| 文件 | 职责 |
|------|------|
| `types.ts` | 全部类型 — PlayerStats / Course / GameEvent / FreeAction / GameState 等 |
| `constants.ts` | 三档难度配置 / 行为数值表 / 点名因子 / FREE_SLOT_EFFECTS / TIME_SLOTS |
| `random.ts` | 随机工具 — chance / pick / shuffle / weightedPick / clamp / probLabel |
| `conditionEval.ts` | 条件表达式 DSL — parseCondition（events + evaluation 共用） |
| `courseGen.ts` | 课程生成（按 density）+ 点名概率 + finalizeCourses |
| `actions.ts` | 行为结算 — 课程行为 / 凌晨行为 / 空闲行为 |
| `events.ts` | 事件筛选 / 数据驱动触发 / 选项结算 |
| `settlement.ts` | 每日结算 — 自然衰减 / 心情联动 / clamp |
| `evaluation.ts` | 六维加权评分 / S~D 评级 / 称号匹配 |
| `gameLoop.ts` | Phase 状态机 |
| `state.ts` | 初始状态工厂 + structuredClone |

### 内容文件清单

| 文件 | 格式 | 内容 |
|------|------|------|
| `actionTexts.yaml` | YAML | 课程/凌晨/空闲行为描述 |
| `settlementTexts.yaml` | YAML | 每日结算描述 |
| `evaluationTexts.yaml` | YAML | 评价称号池 S~D + fallback |
| `courseNames.yaml` | YAML | 34 条课程名 |
| `teacherNames.yaml` | YAML | 点名狂魔/佛系各 10 条 |
| `feedbackTexts.yaml` | YAML | 四维数值区间反馈 |
| `eventTexts.yaml` | YAML | 10 个事件完整定义 |
| `loader.ts` | TS | js-yaml 解析管道 |
| `types.ts` | TS | 配置类型接口 |

---

## 关键架构特性

- **文案零硬编码**：全部 YAML → loader → engine，策划可直接改
- **课程分布**：三档密度 0.55/0.75/1.0，空闲时段无点名风险
- **条件 DSL**：事件触发和称号匹配共用 `parseCondition`
- **点名实时计算**：不复用缓存值，基于累计旷课动态变化
- **测试**：10 文件 109 tests，`npm test` 一键验证

---

## 前端对接要点

1. `courses[day][slot]` 为 `Course | null`，null 时空闲时段 UI 需展示不同按钮
2. `DayDecision` 含 `courseActions` 和 `freeActions` 两个长度为 9 的数组
3. `GameState.phase` 驱动 `CenterPanel` 组件切换
4. 点名概率用 `getEstimatedProbLabel()` 实时获取，不在 Course 上缓存
5. `createDayDecision()` 工厂函数校验数组长度
6. 所有文案从 `loader.ts` 导出获取，不在组件中硬编码
