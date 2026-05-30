import { describe, it, expect } from 'vitest'
import { applyDeltas, settleDay } from '../settlement'
import { createInitialState } from '../state'

describe('applyDeltas', () => {
  it('正数 delta 增加数值', () => {
    const stats = { credits: 50, mood: 60, energy: 70, hunger: 80, entertainment: 90, money: 100, roommateFavor: 50 }
    const result = applyDeltas(stats, { credits: 10, mood: -5 })
    expect(result.credits).toBe(60)
    expect(result.mood).toBe(55)
  })

  it('不越界（clamp 到 STAT_MIN / STAT_MAX）', () => {
    const stats = { credits: 0, mood: 100, energy: 0, hunger: 0, entertainment: 0, money: 0, roommateFavor: 0 }
    const result = applyDeltas(stats, { credits: -10, mood: 10 })
    expect(result.credits).toBe(0)  // clamp 到 min
    expect(result.mood).toBe(100)   // clamp 到 max
  })

  it('不传 delta 时返回原值', () => {
    const stats = { credits: 42, mood: 50, energy: 50, hunger: 50, entertainment: 50, money: 10, roommateFavor: 40 }
    const result = applyDeltas(stats, {})
    expect(result).toEqual(stats)
  })
})

describe('settleDay', () => {
  it('心情高时触发正向描述', () => {
    const state = createInitialState('normal')
    state.pendingDeltas = { mood: 5 }
    state.stats.energy = 90
    state.stats.hunger = 90
    state.stats.entertainment = 90
    // 均值 90 > expectedAvg 50 → moodDeltaFromAvg = 4 > 3
    const result = settleDay(state)
    expect(result.moodDeltaFromAvg).toBeGreaterThan(3)
    expect(result.description.length).toBeGreaterThan(0)
    expect(result.gameOver).toBe(false)
  })

  it('心情低时触发负向描述', () => {
    const state = createInitialState('normal')
    state.pendingDeltas = { mood: -5 }
    state.stats.energy = 10
    state.stats.hunger = 10
    state.stats.entertainment = 10
    // 均值 10 < expectedAvg 50 → moodDeltaFromAvg = -4 < -3
    const result = settleDay(state)
    expect(result.moodDeltaFromAvg).toBeLessThan(-3)
    expect(result.description.length).toBeGreaterThan(0)
  })

  it('心情归零时 gameOver = true', () => {
    const state = createInitialState('normal')
    state.stats.mood = 1
    state.pendingDeltas = { mood: -10 }
    const result = settleDay(state)
    expect(result.gameOver).toBe(true)
  })

  it('学分低于预警值时 warningTriggered = true', () => {
    const state = createInitialState('normal')
    state.stats.credits = 10
    // warningCredits(30) > 10
    const result = settleDay(state)
    expect(result.warningTriggered).toBe(true)
    expect(result.description).toContain('⚠️')
  })
})
