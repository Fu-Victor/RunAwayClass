import { describe, it, expect } from 'vitest'
import { findEligibleEvents, tryTriggerEvent, resolveEventOption } from '../events'
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
  it('返回选项效果和文案', () => {
    const r = resolveEventOption(sampleEvent, 0)
    expect(r.deltas.credits).toBe(1)
    expect(r.flavorText).toBe('ok')
  })

  it('越界索引抛错', () => {
    expect(() => resolveEventOption(sampleEvent, 99)).toThrow('out of range')
  })

  it('负索引抛错', () => {
    expect(() => resolveEventOption(sampleEvent, -1)).toThrow('out of range')
  })
})
