# 游戏平衡调整 + 文案分叉系统 — 设计文档

> 版本：v1.0 | 日期：2026-05-31 | 状态：待实现
>
> 基于 `superpowers:brainstorming` 流程产出，四区块已逐块与用户确认。

---

## 一、需求概述

1. **调低捡钱事件概率** — 收紧天降横财触发条件
2. **降低捡钱收益** — ¥50 → ¥10
3. **全面降低正收益 50%，提高负收益 40%**（保留整数）
4. **文案系统** — 突发事件不能出现与当前选择行为相违背的文案

---

## 二、涉及文件

```
修改:
src/engine/types.ts            — GameEvent 类型扩展
src/engine/constants.ts        — 全部基础值调整
src/engine/events.ts           — resolveText + buildTriggerCtx + 文案解析
src/content/eventTexts.yaml    — 事件效果值 + 条件 + 分叉文案

测试更新:
src/engine/__tests__/constants.test.ts
src/engine/__tests__/actions.test.ts
src/engine/__tests__/events.test.ts
```

---

## 三、数值平衡（区块 1）

### 课程行为

| 常量 | 字段 | 原值 | 新值 |
|------|------|------|------|
| `ATTEND_EFFECT` | credits | +4 | **+2** |
| | energy | -8 | **-11** |
| | hunger | -6 | **-8** |
| | entertainment | -3 | **-4** |
| `SKIP_EFFECT` | energy | +12 | **+6** |
| | hunger | +8 | **+4** |
| | entertainment | +10 | **+5** |
| `SUB_FOR_OTHER_EFFECT` | credits | +2 | **+1** |
| | energy | -12 | **-17** |
| | hunger | -6 | **-8** |
| | entertainment | -5 | **-7** |
| | money | +20 | **+10** |
| | mood | -2 | **-3** |
| `HIRE_SUB_EFFECT` | money | -25 | **-35** |
| `HIRE_SUB_RISK` | — | 0.15 | **0.20** |

### 凌晨行为

| 行为 | 字段 | 原值 | 新值 |
|------|------|------|------|
| `sleep_early` | mood | +5 | **+3** |
| | energy | +30 | **+15** |
| `gaming` | entertainment | +25 | **+13** |
| | energy | -20 | **-28** |
| | roommateFavor | -10 | **-14** |
| `cram` | credits | +3 | **+2** |
| | energy | -25 | **-35** |
| `go_out` | mood | +10 | **+5** |
| | entertainment | +20 | **+10** |
| | money | -20 | **-28** |
| `normal_rest` | energy | +10 | **+5** |

### 空闲时段

| 行为 | 字段 | 原值 | 新值 |
|------|------|------|------|
| `self_study` | energy | -5 | **-7** |
| `rest` | energy | +20 | **+10** |
| `eat` | hunger | +20 | **+10** |
| `entertain` | entertainment | +15 | **+8** |

### 每日消耗 & 其他

| 常量 | 字段 | 原值 | 新值 |
|------|------|------|------|
| `DAILY_DECAY` | energy | -5 | **-7** |
| `DAILY_DECAY` | hunger | -10 | **-14** |
| `DAILY_DECAY` | entertainment | -8 | **-11** |
| `GO_OUT_ROOMMATE_DELTA` | positive/negative | ±5 | **±7** |

---

## 四、事件收益调整（区块 2）

### 课间事件

| 事件 | 选项 | 原效果 | 新效果 |
|------|------|--------|--------|
| 🚨 点名危机 | 飞奔回教室 | energy: -10 | **-14** |
| | 不管了 | credits: -4, mood: -3 | **-6, -4** |
| | 叫舍友喊到 | roommateFavor: -8 | **-11** |
| 📝 突然提问 | 自信作答 | credits: +2, energy: -3 | **+1, -4** |
| | 低头装死 | credits: -1 | 保持 **-1** |
| 🍔 食堂邀约 | 必须去 | hunger: +15, mood: +8, money: -8 | **+8, +4, -11** |
| | 算了下次吧 | roommateFavor: -5 | **-7** |
| 📬 老师私信 | 立马补交 | energy: -10, credits: +1 | **-14, +1** |
| | 装没看见 | credits: -2, mood: -2 | **-3, -3** |
| 💸 天降横财 | 揣兜里 | money: +50, mood: +5 | **+10, +3** |
| | 交失物招领 | mood: +3 | **+2** |
| 📋 突击测验 | 狂补笔记 | energy: -12, credits: +3 | **-17, +2** |
| | 相信自己 | credits: -3 | **-4** |

### 凌晨事件

| 事件 | 选项 | 原效果 | 新效果 |
|------|------|--------|--------|
| 😡 舍友暴怒 | 戴耳机继续 | entertainment: +10, favor: -15, mood: +2 | **+5, -21, +1** |
| | 乖乖关机 | favor: +5, energy: +8 | **+3, +4** |
| 🌙 深夜emo | 打开网抑云 | entertainment: -5, mood: -8 | **-7, -11** |
| | 点夜宵 | money: -15, hunger: +10, mood: +5 | **-21, +5, +3** |
| 📱 外卖诱惑 | 果断下单 | money: -20, hunger: +15, mood: +8 | **-28, +8, +4** |
| | 忍住省钱 | (空) | 保持 (空) |
| 🌅 早起感觉 | 去跑步 | energy: +10, mood: +5 | **+5, +3** |
| | 再睡会 | energy: +15 | **+8** |

---

## 五、事件文案分叉（区块 2+3）

### 事件冲突审查结论

| 事件 | 冲突等级 | 处理方式 |
|------|---------|---------|
| 🚨 点名危机 | 无 | 不改 |
| 📝 突然提问 | 无 | 不改 |
| 🍔 食堂邀约 | 无（重新审查确认无冲突） | 不改 |
| 📬 老师私信 | 无 | 不改 |
| 💸 天降横财 | **严重** | 条件收紧 + 文案分叉 |
| 📋 突击测验 | **中等** | 文案分叉 |
| 😡 舍友暴怒 | 无 | 不改 |
| 🌙 深夜emo | 无 | 不改 |
| 📱 外卖诱惑 | **中等** | 仅收紧条件 |
| 🌅 早起感觉 | 无 | 不改 |

### 💸 天降横财

```yaml
- id: "random_windfall_1"
  phase: "course_break"
  condition: "action != 'skip' and action != 'hire_sub'"
  title: "💸 天降横财"
  description:
    attend: "你在教学楼门口低头一看——地上躺着一张 ¥10！四下无人。"
    sub_for_other: "你替人上完课走出教室，低头一看——地上躺着一张 ¥10！"
    free: "你路过教学楼门口，低头一看——地上躺着一张 ¥10！四下无人。"
  options:
    - text: "🤑 揣兜里"
      effects:
        money: 10
        mood: 3
      flavorText: "横财到手！虽然不多，但蚊子腿也是肉。"
    - text: "😇 交给失物招领"
      effects:
        mood: 2
      flavorText: "没赚到钱，但内心莫名地平静。"
```

> 排除 `skip`（人在宿舍）和 `hire_sub`（花钱找人，不会去教学楼）。

### 📋 突击测验

```yaml
- id: "surprise_quiz_1"
  phase: "course_break"
  condition: "courseType == 'serious' and credits < 20"
  title: "📋 突击测验！！"
  description:
    attend: "据可靠消息，下节课有突击测验！而你几乎没听过课。"
    sub_for_other: "据可靠消息，下节课有突击测验！而你几乎没听过课。"
    skip: "舍友火速微信：'兄弟快回来！！下节课突击测验！！'你看了一眼手机，慌了。"
    hire_sub: "代课侠发来微信：'哥，下节课有测验，你得自己来，我只负责点名。'"
    free: "班级群突然炸了：'下节有突击测验！！'你庆幸自己看到了消息。"
  options:
    - text: "📖 狂补笔记"
      effects:
        energy: -17
        credits: 2
      flavorText:
        attend: "你借学霸笔记疯狂抄了一中午。至少没交白卷。"
        skip: "你让舍友拍照发来笔记，在宿舍狂补。至少没交白卷。"
        default: "你到处借笔记疯狂补课。至少没交白卷。"
    - text: "🎲 相信自己"
      effects:
        credits: -4
      flavorText:
        attend: "你自信满满走进考场……发现自己连题目都看不懂。"
        skip: "你从宿舍狂奔到考场……发现自己连题目都看不懂。"
        default: "你硬着头皮进了考场……发现自己连题目都看不懂。"
```

> condition 不变（任意行为都能收到测验消息），但文案按行为分叉。

### 📱 深夜外卖诱惑

仅收紧 condition，无需文案分叉：

```yaml
- id: "random_midnight_takeout_1"
  phase: "dawn"
  condition: "action != 'sleep_early'"   # 原为 "default"
  title: "📱 深夜外卖诱惑"
  # description 和 options 不变
```

---

## 六、类型与引擎改动（区块 4）

### `types.ts` — GameEvent 类型扩展

```typescript
export interface GameEvent {
  id: string
  phase: 'dawn' | 'course_break'
  condition: string
  title: string
  description: string | Record<string, string>  // 支持分支文案
  options: {
    text: string
    effects: StatsDelta
    flavorText: string | Record<string, string>  // 支持分支文案
  }[]
}
```

### `events.ts` — 核心改动

**新增 `resolveText()`：**

```typescript
function resolveText(
  text: string | Record<string, string>,
  action: string,
): string {
  if (typeof text === 'string') return text
  return text[action] ?? text['default'] ?? Object.values(text)[0] ?? ''
}
```

**修改 `buildTriggerCtx()`：**
- 空闲时段 `action` 设为 `'free'`（当前为空字符串）
- 方便 YAML 按 `free` 分叉

**修改 `tryTriggerEvent()`：**
- 选中事件后调用 `resolveText(event.description, action)` 将 description 解析为字符串
- 选项的 `flavorText` 在 `resolveEventOption()` 中解析

**修改 `resolveEventOption()`：**
- `flavorText` 传入 action，调用 `resolveText()` 解析

---

## 七、执行顺序

| 步骤 | 操作 | 文件 |
|------|------|------|
| 1 | 类型扩展 | `types.ts` — `GameEvent.description` 和 `EventOption.flavorText` 改为 union |
| 2 | 数值基础值 | `constants.ts` — 正收益 ÷2，负收益 ×1.4 |
| 3 | 引擎逻辑 | `events.ts` — `resolveText` + `buildTriggerCtx` free + 文案解析 |
| 4 | 事件数据 | `eventTexts.yaml` — 效果值 + 天降横财/突击测验分叉 + 外卖条件 |
| 5 | 测试更新 | `constants.test.ts` + `actions.test.ts` + `events.test.ts` |
| 6 | 跑测试 | `npx vitest run` — 确认全部通过 |

---

## 八、注意事项

- 基础值改动后，`easy` 难度通过 ×1.3 倍率自动放大（正收益 = 基础×1.3×0.5 = 原值的 65%），`hard` 难度 ×0.75 倍率（正收益 = 基础×0.75×0.5 = 原值的 37.5%）
- `FREE_SLOT_EFFECTS` 不受 `rewardMultiplier` 影响，直接改基础值即可
- 文案分叉兼容旧格式：`string` 类型直接透传，`Record<string, string>` 按 action 取
- `buildTriggerCtx` 新增 `free` action 值对现有 YAML 零影响（因为现有事件不用此 key）

---

> **设计确认记录：** 四个区块已逐块与用户确认通过。2026-05-31。
