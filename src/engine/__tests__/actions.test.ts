import { describe, it, expect } from 'vitest'
import { resolveCourseAction, resolveDawnAction, resolveFreeSlotAction } from '../actions'
import { DIFFICULTY_CONFIGS } from '../constants'
import type { Course, DifficultyConfig, PlayerStats } from '../types'

const normalCourse: Course = {
  id: 'test', name: '测试课', type: 'easy',
  teacher: { name: '李点名', trait: 'roll_call_lover', special: null },
  timeSlotIndex: 2,
}

const baseStats: PlayerStats = {
  credits: 50, mood: 60, energy: 50, hunger: 50,
  entertainment: 50, money: 50, roommateFavor: 50,
}

const config: DifficultyConfig = DIFFICULTY_CONFIGS.normal

describe('resolveCourseAction', () => {
  it('attend 基础收益', () => {
    const r = resolveCourseAction('attend', normalCourse, baseStats, 0, config)
    expect(r.deltas.credits).toBeGreaterThan(0)
    expect(r.deltas.energy).toBeLessThan(0)
    expect(r.description.length).toBeGreaterThan(0)
  })

  it('attend 心情 >=70 额外加分', () => {
    const happy = { ...baseStats, mood: 80 }
    const r = resolveCourseAction('attend', normalCourse, happy, 0, config)
    expect(r.deltas.credits).toBeGreaterThan(3) // 基础2 + 额外2
  })

  it('attend 心情 <=30 学分衰减', () => {
    const sad = { ...baseStats, mood: 20 }
    const r = resolveCourseAction('attend', normalCourse, sad, 0, config)
    expect(r.deltas.credits).toBeLessThan(3) // 基础3 - 衰减
  })

  it('skip 未被点名时回血', () => {
    // 不爱点名的老师+水课+非早八 → 概率很低
    const safeCourse: Course = {
      ...normalCourse,
      teacher: { name: '王划水', trait: 'roll_call_hater', special: null },
      type: 'easy',
      timeSlotIndex: 3,
    }
    const r = resolveCourseAction('skip', safeCourse, baseStats, 0, config)
    expect(r.deltas.entertainment).toBeGreaterThan(0)
    expect(r.deltas.hunger).toBeLessThan(0)
    // 精力随机 [-2, +3]，不做确定性断言
    // 点名概率 15%，非确定性，不做触发断言
  })

  it('skip 累计旷课影响点名概率', () => {
    // 累计旷课30次+爱点名+正课+早八 → 概率极高
    const riskyCourse: Course = {
      ...normalCourse,
      type: 'serious',
      timeSlotIndex: 0,
    }
    // 跑多次验证至少有一次被点名
    let rollCalls = 0
    for (let i = 0; i < 50; i++) {
      const r = resolveCourseAction('skip', riskyCourse, baseStats, 30, config)
      if (r.triggeredRollCall) rollCalls++
    }
    expect(rollCalls).toBeGreaterThan(0)
  })

  it('sub_for_other 赚钱', () => {
    const r = resolveCourseAction('sub_for_other', normalCourse, baseStats, 0, config)
    expect(r.deltas.money).toBeGreaterThan(0)
    expect(r.deltas.energy).toBeLessThan(0)
  })

  it('hire_sub 消耗金钱', () => {
    const safeCourse: Course = {
      ...normalCourse,
      teacher: { name: '王划水', trait: 'roll_call_hater', special: null },
    }
    const r = resolveCourseAction('hire_sub', safeCourse, baseStats, 0, config)
    expect(r.deltas.money).toBe(-25)
    // 不被点名（老师不爱点名 + 非正课 + 非早八）
    expect(r.triggeredRollCall).toBe(false)
    // hireSubFailed 有概率，不做确定性断言
  })

  it('rewardMultiplier 影响收益', () => {
    const easyConfig = DIFFICULTY_CONFIGS.easy
    const hardConfig = DIFFICULTY_CONFIGS.hard
    const rEasy = resolveCourseAction('attend', normalCourse, baseStats, 0, easyConfig)
    const rHard = resolveCourseAction('attend', normalCourse, baseStats, 0, hardConfig)
    // 简单难度收益应高于困难
    expect((rEasy.deltas.credits ?? 0)).toBeGreaterThan((rHard.deltas.credits ?? 0))
  })
})

describe('resolveDawnAction', () => {
  it('五种凌晨行为均返回有效描述', () => {
    for (const action of ['sleep_early', 'gaming', 'cram', 'go_out', 'normal_rest'] as const) {
      const r = resolveDawnAction(action)
      expect(r.description.length).toBeGreaterThan(0)
      expect(r.deltas).toBeDefined()
    }
  })

  it('go_out 随机舍友好感度', () => {
    let positives = 0
    let negatives = 0
    for (let i = 0; i < 100; i++) {
      const r = resolveDawnAction('go_out')
      const delta = r.deltas.roommateFavor ?? 0
      if (delta > 0) positives++
      else if (delta < 0) negatives++
    }
    expect(positives).toBeGreaterThan(0)
    expect(negatives).toBeGreaterThan(0)
  })
})

describe('resolveFreeSlotAction', () => {
  it('四种空闲行为均返回有效描述', () => {
    for (const action of ['self_study', 'rest', 'eat', 'entertain'] as const) {
      const r = resolveFreeSlotAction(action)
      expect(r.description.length).toBeGreaterThan(0)
      expect(r.deltas).toBeDefined()
    }
  })

  it('rest 精力恢复最多', () => {
    const r = resolveFreeSlotAction('rest')
    expect(r.deltas.energy).toBeGreaterThan(5)
  })

  it('eat 饱腹恢复最多', () => {
    const r = resolveFreeSlotAction('eat')
    expect(r.deltas.hunger).toBeGreaterThan(5)
  })

  it('self_study 有学分收入', () => {
    const r = resolveFreeSlotAction('self_study')
    expect(r.deltas.credits).toBeGreaterThan(0)
  })
})
