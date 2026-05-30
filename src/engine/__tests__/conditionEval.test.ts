import { describe, it, expect } from 'vitest'
import { parseCondition } from '../conditionEval'

describe('parseCondition', () => {
  it('default 表达式永远返回 true', () => {
    expect(parseCondition('default', {})).toBe(true)
  })

  it('空字符串返回 false', () => {
    expect(parseCondition('', {})).toBe(false)
  })

  it('数字比较 >=', () => {
    expect(parseCondition('credits >= 50', { credits: 60 })).toBe(true)
    expect(parseCondition('credits >= 50', { credits: 30 })).toBe(false)
  })

  it('数字比较 <=', () => {
    expect(parseCondition('mood <= 30', { mood: 20 })).toBe(true)
    expect(parseCondition('mood <= 30', { mood: 50 })).toBe(false)
  })

  it('数字比较 >', () => {
    expect(parseCondition('skipRate > 0.5', { skipRate: 0.7 })).toBe(true)
    expect(parseCondition('skipRate > 0.5', { skipRate: 0.3 })).toBe(false)
  })

  it('数字比较 <', () => {
    expect(parseCondition('money < 100', { money: 50 })).toBe(true)
    expect(parseCondition('money < 100', { money: 150 })).toBe(false)
  })

  it('数字比较 ==', () => {
    expect(parseCondition('credits == 0', { credits: 0 })).toBe(true)
    expect(parseCondition('credits == 10', { credits: 5 })).toBe(false)
  })

  it('数字比较 !=', () => {
    expect(parseCondition('money != 0', { money: 5 })).toBe(true)
    expect(parseCondition('money != 0', { money: 0 })).toBe(false)
  })

  it('and 组合条件', () => {
    const ctx = { credits: 70, mood: 80 }
    expect(parseCondition('credits >= 70 and mood >= 70', ctx)).toBe(true)
    expect(parseCondition('credits >= 70 and mood >= 90', ctx)).toBe(false)
  })

  it('or 组合条件', () => {
    const ctx = { credits: 30, money: 100 }
    expect(parseCondition('credits >= 50 or money >= 80', ctx)).toBe(true)
    expect(parseCondition('credits >= 50 or money >= 150', ctx)).toBe(false)
  })

  it('字符串比较 ==', () => {
    const ctx: Record<string, string | number> = { action: 'skip', trait: 'roll_call_lover' }
    expect(parseCondition("action == 'skip'", ctx)).toBe(true)
    expect(parseCondition("action == 'attend'", ctx)).toBe(false)
  })

  it('字符串比较 !=', () => {
    const ctx: Record<string, string | number> = { trait: 'roll_call_hater' }
    expect(parseCondition("trait != 'roll_call_lover'", ctx)).toBe(true)
    expect(parseCondition("trait != 'roll_call_hater'", ctx)).toBe(false)
  })

  it('字符串和数字混合 and', () => {
    const ctx: Record<string, string | number> = { action: 'skip', trait: 'roll_call_lover', credits: 30 }
    expect(parseCondition("action == 'skip' and trait == 'roll_call_lover'", ctx)).toBe(true)
    expect(parseCondition("action == 'skip' and credits >= 50", ctx)).toBe(false)
  })

  it('未知变量返回 false 并 console.warn', () => {
    const warn = console.warn
    const warnings: string[] = []
    console.warn = (msg: string) => warnings.push(msg)
    expect(parseCondition('madeup >= 50', { credits: 60 })).toBe(false)
    expect(warnings.length).toBeGreaterThan(0)
    console.warn = warn
  })
})
