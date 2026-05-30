import { describe, it, expect } from 'vitest'
import { createInitialState, cloneState } from '../state'
import { STAT_MAX, STAT_MIN, TIME_SLOTS, TOTAL_DAYS } from '../constants'

describe('createInitialState', () => {
  it('三档难度均可创建', () => {
    for (const d of ['easy', 'normal', 'hard'] as const) {
      const state = createInitialState(d)
      expect(state.phase).toBe('START')
      expect(state.day).toBe(1)
      expect(state.courseIndex).toBe(0)
    }
  })

  it('初始数值在合法范围', () => {
    const state = createInitialState('normal')
    for (const key of Object.keys(state.stats) as (keyof typeof state.stats)[]) {
      expect(state.stats[key]).toBeGreaterThanOrEqual(STAT_MIN[key])
      expect(state.stats[key]).toBeLessThanOrEqual(STAT_MAX[key])
    }
  })

  it('课程数组尺寸正确', () => {
    const state = createInitialState('normal')
    expect(state.courses).toHaveLength(TOTAL_DAYS)
    for (const day of state.courses) {
      expect(day).toHaveLength(TIME_SLOTS.length)
    }
  })

  it('空数组初始化', () => {
    const state = createInitialState('normal')
    expect(state.decisions).toEqual([])
    expect(state.history).toEqual([])
    expect(state.usedEventIds).toEqual([])
  })

  it('pendingDeltas 和 showWarning 初始值', () => {
    const state = createInitialState('normal')
    expect(state.pendingDeltas).toEqual({})
    expect(state.showWarning).toBe(false)
    expect(state.totalSkipCount).toBe(0)
  })
})

describe('cloneState', () => {
  it('深拷贝与原始对象不共享引用', () => {
    const state = createInitialState('normal')
    const cloned = cloneState(state)

    cloned.stats.credits = 999
    expect(state.stats.credits).not.toBe(999)

    cloned.usedEventIds.push('test')
    expect(state.usedEventIds).not.toContain('test')
  })

  it('深拷贝后数值相等', () => {
    const state = createInitialState('normal')
    state.stats.credits = 42
    const cloned = cloneState(state)
    expect(cloned.stats.credits).toBe(42)
    expect(cloned.difficulty).toBe(state.difficulty)
  })
})
