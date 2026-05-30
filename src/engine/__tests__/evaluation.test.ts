import { describe, it, expect } from 'vitest'
import { evaluate, evaluateFailure } from '../evaluation'
import { createInitialState } from '../state'
import type { DayDecision } from '../types'

describe('evaluate', () => {
  it('高数值返回 S 评级', () => {
    const state = createInitialState('normal')
    state.stats = { credits: 80, mood: 90, energy: 90, hunger: 90, entertainment: 90, money: 100, roommateFavor: 90 }
    state.decisions = [{ courseActions: new Array(9).fill('attend'), freeActions: new Array(9).fill('rest'), dawnAction: 'normal_rest' }]
    const result = evaluate(state)
    expect(result.rating).toBe('S')
    expect(result.title.length).toBeGreaterThan(0)
    expect(result.comment.length).toBeGreaterThan(0)
  })

  it('全低数值返回 D 评级', () => {
    const state = createInitialState('normal')
    state.stats = { credits: 20, mood: 20, energy: 20, hunger: 20, entertainment: 20, money: 0, roommateFavor: 10 }
    state.decisions = new Array(7).fill(null).map((): DayDecision => ({
      courseActions: new Array(9).fill('skip'),
      freeActions: new Array(9).fill('rest'),
      dawnAction: 'gaming',
    }))
    const result = evaluate(state)
    expect(result.rating).toBe('D')
  })

  it('根据数值特征匹配不同称号', () => {
    // 偏科学霸
    const stateA = createInitialState('normal')
    stateA.stats = { credits: 80, mood: 30, energy: 90, hunger: 90, entertainment: 70, money: 30, roommateFavor: 40 }
    stateA.decisions = [{ courseActions: new Array(9).fill('attend'), freeActions: new Array(9).fill('rest'), dawnAction: 'normal_rest' }]
    const rA = evaluate(stateA)
    // 学分高但心情低 → 可能是苦行僧类
    expect(rA.title).toBeDefined()

    // 偏科搞钱
    const stateB = createInitialState('normal')
    stateB.stats = { credits: 40, mood: 60, energy: 50, hunger: 50, entertainment: 50, money: 90, roommateFavor: 50 }
    stateB.decisions = [{ courseActions: new Array(9).fill('sub_for_other'), freeActions: new Array(9).fill('rest'), dawnAction: 'normal_rest' }]
    const rB = evaluate(stateB)
    expect(rB.title).toBeDefined()
    // 两个不同画像应给出不同称号
    expect(rA.title).not.toBe(rB.title)
  })
})

describe('evaluateFailure', () => {
  it('学分极低时给出失败评价', () => {
    const stats = { credits: 5, mood: 0, energy: 0, hunger: 0, entertainment: 0, money: 0, roommateFavor: 0 }
    const result = evaluateFailure(stats)
    expect(result.rating).toBe('D')
    expect(result.title.length).toBeGreaterThan(0)
  })

  it('学分尚可但心情归零', () => {
    const stats = { credits: 60, mood: 0, energy: 0, hunger: 0, entertainment: 0, money: 0, roommateFavor: 0 }
    const result = evaluateFailure(stats)
    expect(result.title.length).toBeGreaterThan(0)
  })
})
