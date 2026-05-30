import { describe, it, expect } from 'vitest'
import { findEligibleEvents, tryTriggerEvent, resolveEventOption, resolveText } from '../events'
import { createInitialState } from '../state'
import type { DayDecision, GameEvent } from '../types'

const sampleEvent: GameEvent = {
  id: 'test_random',
  phase: 'course_break',
  condition: 'default',
  title: '测试事件',
  description: '测试',
  options: [
    { text: 'A', effects: { credits: 1 }, flavorText: 'ok' },
    { text: 'B', effects: { mood: -1 }, flavorText: 'no' },
  ],
}

const dawnEvent: GameEvent = {
  id: 'test_dawn',
  phase: 'dawn',
  condition: "action == 'gaming'",
  title: '凌晨测试',
  description: '测试',
  options: [{ text: 'A', effects: {}, flavorText: 'ok' }],
}

// 包含文案分叉的事件
const branchedEvent: GameEvent = {
  id: 'test_branched',
  phase: 'course_break',
  condition: 'default',
  title: '分叉测试',
  description: {
    attend: '你在教室看到了测试提示',
    skip: '你在宿舍收到了测试消息',
    free: '你路过时看到了测试提示',
    default: '默认测试文案',
  },
  options: [
    {
      text: 'A',
      effects: { credits: 1 },
      flavorText: {
        attend: '教室内的结果',
        skip: '宿舍内的结果',
        default: '默认结果',
      },
    },
  ],
}

describe('findEligibleEvents', () => {
  it('按 phase 过滤', () => {
    const state = createInitialState('normal')
    const eligible = findEligibleEvents([sampleEvent, dawnEvent], state, 'course_break')
    expect(eligible).toHaveLength(1)
    expect(eligible[0].id).toBe('test_random')
  })

  it('已触发事件被排除', () => {
    const state = createInitialState('normal')
    state.usedEventIds = ['test_random']
    const eligible = findEligibleEvents([sampleEvent], state, 'course_break')
    expect(eligible).toHaveLength(0)
  })

  it('condition 不匹配时被排除', () => {
    const state = createInitialState('normal')
    const eligible = findEligibleEvents([dawnEvent], state, 'dawn')
    // 未选 gaming，不应匹配
    expect(eligible).toHaveLength(0)
  })
})

describe('tryTriggerEvent', () => {
  it('空列表返回 null', () => {
    expect(tryTriggerEvent([])).toBeNull()
  })

  it('baseChance=1 且非空时必定触发', () => {
    let triggered = 0
    for (let i = 0; i < 20; i++) {
      if (tryTriggerEvent([sampleEvent], 1.0) !== null) triggered++
    }
    expect(triggered).toBe(20)
  })

  it('bias 影响实际概率', () => {
    // bias=-1 加上 baseChance=0.35 → 实际概率 0，永不触发
    const result = tryTriggerEvent([sampleEvent], 0.35, -1)
    expect(result).toBeNull()
  })
})

describe('resolveEventOption', () => {
  it('返回选项效果和文案 (string flavorText)', () => {
    const r = resolveEventOption(sampleEvent, 0, 'attend')
    expect(r.deltas.credits).toBe(1)
    expect(r.flavorText).toBe('ok')
  })

  it('越界索引抛错', () => {
    expect(() => resolveEventOption(sampleEvent, 99, 'attend')).toThrow('out of range')
  })

  it('负索引抛错', () => {
    expect(() => resolveEventOption(sampleEvent, -1, 'attend')).toThrow('out of range')
  })

  it('按 action 解析分叉 flavorText', () => {
    const rSkip = resolveEventOption(branchedEvent, 0, 'skip')
    expect(rSkip.flavorText).toBe('宿舍内的结果')

    const rAttend = resolveEventOption(branchedEvent, 0, 'attend')
    expect(rAttend.flavorText).toBe('教室内的结果')

    // 不匹配的 action fallback 到 default
    const rUnknown = resolveEventOption(branchedEvent, 0, 'hire_sub')
    expect(rUnknown.flavorText).toBe('默认结果')
  })
})

describe('resolveText', () => {
  it('string 直接返回', () => {
    expect(resolveText('普通文案', 'attend')).toBe('普通文案')
  })

  it('Record 按 action 匹配', () => {
    const map = { attend: '教室文案', skip: '宿舍文案', free: '路过文案' }
    expect(resolveText(map, 'skip')).toBe('宿舍文案')
    expect(resolveText(map, 'attend')).toBe('教室文案')
    expect(resolveText(map, 'free')).toBe('路过文案')
  })

  it('Record 无匹配 fallback 到 default', () => {
    const map = { attend: '教室文案', default: '默认文案' }
    expect(resolveText(map, 'skip')).toBe('默认文案')
  })

  it('Record 无 default 也无匹配 fallback 到第一个值', () => {
    const map = { attend: '唯一文案' }
    expect(resolveText(map, 'skip')).toBe('唯一文案')
  })

  it('空 Record fallback 到空字符串', () => {
    expect(resolveText({}, 'attend')).toBe('')
  })
})
