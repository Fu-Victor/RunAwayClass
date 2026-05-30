import { describe, it, expect } from 'vitest'
import { DIFFICULTY_CONFIGS, DEFAULT_THRESHOLDS, STAT_MAX, STAT_MIN, DAWN_EFFECTS, DAILY_DECAY, TIME_SLOTS, TOTAL_DAYS } from '../constants'

describe('难度配置完整性', () => {
  const difficulties = ['easy', 'normal', 'hard'] as const

  it('三档难度均有配置', () => {
    for (const d of difficulties) {
      expect(DIFFICULTY_CONFIGS[d]).toBeDefined()
      expect(DEFAULT_THRESHOLDS[d]).toBeDefined()
    }
  })

  it('初始数值在合法范围内', () => {
    for (const d of difficulties) {
      const stats = DIFFICULTY_CONFIGS[d].initialStats
      for (const key of Object.keys(stats) as (keyof typeof stats)[]) {
        expect(stats[key]).toBeGreaterThanOrEqual(STAT_MIN[key])
        expect(stats[key]).toBeLessThanOrEqual(STAT_MAX[key])
      }
    }
  })

  it('warningCredits < passCredits（提前预警）', () => {
    for (const d of difficulties) {
      const t = DEFAULT_THRESHOLDS[d]
      expect(t.warningCredits).toBeLessThan(t.passCredits)
    }
  })

  it('tutorCredits > passCredits（家教值是更高的门槛）', () => {
    for (const d of difficulties) {
      const t = DEFAULT_THRESHOLDS[d]
      expect(t.tutorCredits).toBeGreaterThan(t.passCredits)
    }
  })

  it('rewardMultiplier 随难度递减', () => {
    expect(DIFFICULTY_CONFIGS.easy.rewardMultiplier).toBeGreaterThan(DIFFICULTY_CONFIGS.normal.rewardMultiplier)
    expect(DIFFICULTY_CONFIGS.normal.rewardMultiplier).toBeGreaterThan(DIFFICULTY_CONFIGS.hard.rewardMultiplier)
  })

  it('DAWN_EFFECTS 覆盖所有 DawnAction', () => {
    const actions = ['sleep_early', 'gaming', 'cram', 'go_out', 'normal_rest']
    for (const a of actions) {
      expect(DAWN_EFFECTS[a as keyof typeof DAWN_EFFECTS]).toBeDefined()
    }
  })

  it('每日自然消耗全为负数或零', () => {
    for (const key of Object.keys(DAILY_DECAY) as (keyof typeof DAILY_DECAY)[]) {
      expect(DAILY_DECAY[key]).toBeLessThanOrEqual(0)
    }
  })

  it('TIME_SLOTS 共 9 个时段', () => {
    expect(TIME_SLOTS).toHaveLength(9)
  })

  it('TOTAL_DAYS 为 7', () => {
    expect(TOTAL_DAYS).toBe(7)
  })
})
