# UI 修复与优化 — 设计文档

> 版本：v1.0 | 日期：2026-05-31 | 状态：待实现

---

## 一、需求概述

1. **Bug 修复** — 打工/娱乐/睡觉/吃饭等非上课行为异常继承 skip 回血效果
2. **手机消息动态化** — 半动态消息 + 事件触发时插入临时消息
3. **新消息横幅通知** — iOS 风格顶部横幅 + 红点脉冲 + 未读角标
4. **课表 CSS 布局** — 课程区撑大、确认按钮加大、元素下移填满手机

---

## 二、涉及文件

```
src/engine/constants.ts        — SKIP_EFFECT 数值调整
src/engine/actions.ts          — skip 结算中精力随机波动
src/store/gameStore.jsx        — 事件消息持久化 + 基础消息池
src/pages/Game.jsx             — 横幅通知 + 微信角标
src/pages/Game.css             — 横幅动画 + 课表布局
src/engine/__tests__/actions.test.ts — 更新 skip 断言
```

---

## 三、区块 1：Skip 基础效果修复

### 3.1 `constants.ts` — SKIP_EFFECT

```
原值: energy: 6,  hunger: 4,  entertainment: 5
新值: energy: 0,  hunger: -4, entertainment: 5
```

> 旷课不再白送精力/饱腹。娱乐照给（旷课就是为了玩）。

### 3.2 `actions.ts` — skip 结算中精力随机

在 `resolveCourseAction` 的 `case 'skip'` 中，未被点名时，精力在 `[-2, +3]` 区间随机：

```typescript
// skip 基础 energy 为 0，加随机波动
const energyDelta = Math.floor(Math.random() * 6) - 2 // [-2, 3]
add(deltas, 'energy', Math.round(energyDelta * mult))
```

> 模拟旷课期间可能补觉（+精力）也可能通宵（-精力）的不确定性。

### 3.3 效果影响

| 行为 | 引擎映射 | 效果（普通难度） |
|------|---------|-----------------|
| 旷课 | skip | 娱乐+5, 饱腹-4, 精力-2~+3 |
| 打工 | work→skip | skip效果 + 金钱+10 |
| 娱乐 | fun→skip | skip效果 + 娱乐+8 |
| 睡觉 | sleep→skip | skip效果 + 精力+8 |
| 吃饭 | meal→skip | skip效果 + 饱腹+8 |

> 不再出现"打工全属性升高"或"娱乐回血"问题。

---

## 四、区块 2：消息动态化 + 横幅通知

### 4.1 基础消息池

```javascript
// gameStore.jsx 新增
const BASE_MESSAGES = [
  { from: '舍友群聊', text: '兄弟，下节课老师可能查人，床位先别焊死。' },
  { from: '班级通知', text: '明早 8 点有课，请同学们带上身体和灵魂。' },
  { from: '老师私信', text: '你上次作业的存在感，比我的发际线还稀薄。' },
  { from: '舍友群聊', text: '今晚开黑不？就差你一个了。' },
  { from: '班级通知', text: '据可靠消息，明天上午可能有突击测验。' },
  { from: '神秘匿名', text: '我知道你上周三在哪。' },
]
```

### 4.2 消息生成逻辑

- 游戏开始时：从池中随机取 3 条作为初始消息
- 事件触发时：插入事件消息（`from`=事件来源映射，`text`=事件标题）
- 事件解决后：消息保留在列表中，标记为已读
- 新一天开始时：`eventMessage` 清空（已在 DISMISS_SETTLEMENT 中处理）

### 4.3 事件来源映射

```javascript
const EVENT_SOURCE = {
  roll_call_crisis: '班级通知',
  social_invite: '舍友群聊',
  random_teacher_dm: '老师私信',
  surprise_quiz: '班级通知',
  default: '系统通知',
}
```

### 4.4 横幅通知

**Game.jsx — PhoneFrame 中新增：**

```jsx
{eventMessage && (
  <div className="phone-banner" onAnimationEnd={() => /* 不移除，保留在列表 */}>
    <span className="banner-avatar">{eventMessage.from.slice(0, 1)}</span>
    <span>
      <strong>{eventMessage.from}</strong>
      <small>{eventMessage.text}</small>
    </span>
  </div>
)}
```

**Game.css — 横幅动画：**

```css
.phone-banner {
  position: absolute; top: 54px; left: 6px; right: 6px; z-index: 10;
  background: rgba(30, 30, 30, 0.92); color: #fff;
  padding: 10px 14px; border-radius: 12px; font-size: 12px;
  display: flex; align-items: center; gap: 10px;
  backdrop-filter: blur(8px);
  animation: bannerSlideIn 0.35s ease-out, bannerFadeOut 0.3s 2.8s ease-in forwards;
  pointer-events: none;
}
@keyframes bannerSlideIn { from { transform: translateY(-50px); opacity: 0; } }
@keyframes bannerFadeOut { to { opacity: 0; transform: translateY(-24px); } }
```

### 4.5 微信图标角标

手机主屏微信 App 图标上叠加未读事件消息计数：

```jsx
{unreadEventCount > 0 && <span className="app-badge">{unreadEventCount}</span>}
```

```css
.app-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 18px; height: 18px; border-radius: 9px;
  background: #ff3b30; color: #fff;
  font-size: 11px; font-weight: 700;
  display: grid; place-items: center;
}
```

---

## 五、区块 3：课表 CSS 布局

### 5.1 改动值

| 选择器 | 属性 | 当前值 | 新值 |
|--------|------|--------|------|
| `.schedule-period-row` | `min-height` | `94px` | `105px` |
| `.decision-btn` | `min-height` | `32px` | `36px` |
| `.phone-submit-plan` | `min-height` | (默认) | `44px` |
| `.phone-submit-plan` | `font-size` | (默认) | `15px` |
| `.phone-submit-plan` | `font-weight` | (默认) | `700` |
| `.phone-decision-bar` | `padding` | `6px` | `8px 8px` |
| `.phone-schedule-board` | — | (无) | 新增 `min-height: 100%` 确保填充 |

### 5.2 布局效果

```
┌─ 手机顶部 ───────────┐
│ 第 X 天 · 夜晚决策     │
├──────────────────────┤
│ 早上 │ [课A] [课B] [课C] │  ← 105px min-height
│ 下午 │ [课D] [课E] [课F] │
│ 晚上 │ [课G] [课H] [课I] │
│ 今夜 │ [早睡][熬夜]…    │
├──────────────────────┤
│ 已选中：高等数学        │
│ [上课][娱乐][睡觉][吃饭]│  ← 36px 按钮
│ [代课][找人][打工][家教]│
├──────────────────────┤
│    确 认 安 排！      │  ← 44px 大按钮
└──────────────────────┘
```

---

## 六、执行顺序

| 步骤 | 改动 | 文件 |
|------|------|------|
| 1 | Skip 基础值 + 精力随机 | `constants.ts` + `actions.ts` |
| 2 | 测试更新 | `actions.test.ts` |
| 3 | 基础消息池 + 事件来源映射 | `gameStore.jsx` |
| 4 | 横幅 + 角标 + 消息渲染 | `Game.jsx` |
| 5 | 课表 CSS 布局 | `Game.css` |
| 6 | 跑测试 | `npx vitest run` |

---

> **设计确认记录：** 三个区块已逐块与用户确认通过。2026-05-31。
