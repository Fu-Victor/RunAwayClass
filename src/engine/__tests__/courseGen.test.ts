import { describe, it, expect } from 'vitest'
import { generateCourses, calcRollCallProb, checkRollCall, finalizeCourses } from '../courseGen'
import { DIFFICULTY_CONFIGS, TIME_SLOTS, TOTAL_DAYS } from '../constants'
import type { Course } from '../types'

describe('generateCourses', () => {
  it('生成 TOTAL_DAYS 天', () => {
    const courses = generateCourses(DIFFICULTY_CONFIGS.normal)
    expect(courses).toHaveLength(TOTAL_DAYS)
  })

  it('每天有 TIME_SLOTS.length 个时段', () => {
    const courses = generateCourses(DIFFICULTY_CONFIGS.normal)
    for (const day of courses) {
      expect(day).toHaveLength(TIME_SLOTS.length)
    }
  })

  it('困难难度满课', () => {
    const courses = generateCourses(DIFFICULTY_CONFIGS.hard)
    for (const day of courses) {
      const courseCount = day.filter(c => c !== null).length
      expect(courseCount).toBe(9)
    }
  })

  it('简单难度有空闲时段', () => {
    const courses = generateCourses(DIFFICULTY_CONFIGS.easy)
    let freeCount = 0
    for (const day of courses) {
      freeCount += day.filter(c => c === null).length
    }
    // 7天总共应有空闲
    expect(freeCount).toBeGreaterThan(0)
  })

  it('普通难度课程数在密度附近', () => {
    const courses = generateCourses(DIFFICULTY_CONFIGS.normal)
    let total = 0
    for (const day of courses) {
      total += day.filter(c => c !== null).length
    }
    const avg = total / TOTAL_DAYS
    // 0.75 * 9 = 6.75, 允许 ±2
    expect(avg).toBeGreaterThan(4)
    expect(avg).toBeLessThan(9)
  })
})

describe('calcRollCallProb', () => {
  const course: Course = {
    id: 'test', name: '测试', type: 'easy',
    teacher: { name: '李点名', trait: 'roll_call_lover', special: null },
    timeSlotIndex: 2,
  }

  it('爱点名老师基础概率更高', () => {
    const prob = calcRollCallProb(course, 0, DIFFICULTY_CONFIGS.normal)
    expect(prob).toBeGreaterThanOrEqual(0.5)
  })

  it('正课增加概率', () => {
    const serious: Course = { ...course, type: 'serious' }
    const easyProb = calcRollCallProb(course, 0, DIFFICULTY_CONFIGS.normal)
    const seriousProb = calcRollCallProb(serious, 0, DIFFICULTY_CONFIGS.normal)
    expect(seriousProb).toBeGreaterThan(easyProb)
  })

  it('早八增加概率', () => {
    const early: Course = { ...course, timeSlotIndex: 0 }
    const lateProb = calcRollCallProb(course, 0, DIFFICULTY_CONFIGS.normal)
    const earlyProb = calcRollCallProb(early, 0, DIFFICULTY_CONFIGS.normal)
    expect(earlyProb).toBeGreaterThan(lateProb)
  })

  it('累计旷课增加概率', () => {
    const p0 = calcRollCallProb(course, 0, DIFFICULTY_CONFIGS.normal)
    const p10 = calcRollCallProb(course, 10, DIFFICULTY_CONFIGS.normal)
    expect(p10).toBeGreaterThan(p0)
  })

  it('概率不超过 1', () => {
    const prob = calcRollCallProb(course, 100, DIFFICULTY_CONFIGS.normal)
    expect(prob).toBeLessThanOrEqual(1)
  })

  it('概率不低于 0', () => {
    const prob = calcRollCallProb(course, 0, DIFFICULTY_CONFIGS.hard)
    expect(prob).toBeGreaterThanOrEqual(0)
  })
})

describe('checkRollCall', () => {
  it('prob=1 永远 true', () => {
    for (let i = 0; i < 20; i++) {
      expect(checkRollCall(1)).toBe(true)
    }
  })

  it('prob=0 永远 false', () => {
    for (let i = 0; i < 20; i++) {
      expect(checkRollCall(0)).toBe(false)
    }
  })
})

describe('finalizeCourses', () => {
  it('填充课程名和老师名，跳过 null', () => {
    const courses = generateCourses(DIFFICULTY_CONFIGS.normal)
    finalizeCourses(courses, ['高等数学（睡觉版）'], {
      roll_call_lover: ['李点名'],
      roll_call_hater: ['王划水'],
    })
    for (const day of courses) {
      for (const c of day) {
        if (c === null) continue
        expect(c.name.length).toBeGreaterThan(0)
        expect(c.teacher.name.length).toBeGreaterThan(0)
        expect(c.id.length).toBeGreaterThan(0)
      }
    }
  })
})
