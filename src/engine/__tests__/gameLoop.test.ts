import { describe, it, expect } from 'vitest'
import { nextPhase, phaseDuration } from '../gameLoop'

describe('nextPhase', () => {
  it('START → NIGHT_DECISION', () => {
    expect(nextPhase('START')).toBe('NIGHT_DECISION')
  })

  it('NIGHT_DECISION → DAWN', () => {
    expect(nextPhase('NIGHT_DECISION')).toBe('DAWN')
  })

  it('DAWN → DAY_PROGRESSION（无事件时）', () => {
    expect(nextPhase('DAWN')).toBe('DAY_PROGRESSION')
  })

  it('DAWN → DAWN_EVENT（有事件时）', () => {
    expect(nextPhase('DAWN', { hasEvent: true })).toBe('DAWN_EVENT')
  })

  it('DAWN_EVENT → DAY_PROGRESSION', () => {
    expect(nextPhase('DAWN_EVENT')).toBe('DAY_PROGRESSION')
  })

  it('DAY_PROGRESSION → EVENT（有事件时）', () => {
    expect(nextPhase('DAY_PROGRESSION', { hasEvent: true })).toBe('EVENT')
  })

  it('DAY_PROGRESSION → DAY_SETTLEMENT（最后一节课时）', () => {
    expect(nextPhase('DAY_PROGRESSION', { isLastCourse: true })).toBe('DAY_SETTLEMENT')
  })

  it('EVENT → DAY_SETTLEMENT（事件结束后是最后一节课）', () => {
    expect(nextPhase('EVENT', { isLastCourse: true })).toBe('DAY_SETTLEMENT')
  })

  it('EVENT → DAY_PROGRESSION（事件结束后还有课）', () => {
    expect(nextPhase('EVENT')).toBe('DAY_PROGRESSION')
  })

  it('DAY_SETTLEMENT → GAME_OVER（心情归零）', () => {
    expect(nextPhase('DAY_SETTLEMENT', { gameOver: true })).toBe('GAME_OVER')
  })

  it('DAY_SETTLEMENT → GAME_WIN（第 7 天）', () => {
    expect(nextPhase('DAY_SETTLEMENT', { isLastDay: true })).toBe('GAME_WIN')
  })

  it('DAY_SETTLEMENT → NIGHT_DECISION（正常进入下一天）', () => {
    expect(nextPhase('DAY_SETTLEMENT')).toBe('NIGHT_DECISION')
  })

  it('GAME_OVER → START', () => {
    expect(nextPhase('GAME_OVER')).toBe('START')
  })

  it('GAME_WIN → START', () => {
    expect(nextPhase('GAME_WIN')).toBe('START')
  })
})

describe('phaseDuration', () => {
  it('需要玩家交互的阶段返回 0', () => {
    expect(phaseDuration('NIGHT_DECISION')).toBe(0)
    expect(phaseDuration('DAWN_EVENT')).toBe(0)
    expect(phaseDuration('EVENT')).toBe(0)
    expect(phaseDuration('START')).toBe(0)
  })

  it('自动推进阶段返回正数', () => {
    expect(phaseDuration('DAWN')).toBe(2000)
    expect(phaseDuration('DAY_PROGRESSION')).toBe(2500)
    expect(phaseDuration('DAY_SETTLEMENT')).toBe(3000)
  })
})
