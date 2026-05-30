import { describe, it, expect } from 'vitest'
import { randInt, randFloat, chance, pick, pickN, shuffle, weightedPick, clamp, probLabel } from '../random'

describe('randInt', () => {
  it('返回 [min, max] 范围内的整数', () => {
    for (let i = 0; i < 100; i++) {
      const v = randInt(1, 10)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(10)
      expect(Number.isInteger(v)).toBe(true)
    }
  })

  it('min > max 时抛错', () => {
    expect(() => randInt(5, 3)).toThrow('randInt')
  })
})

describe('randFloat', () => {
  it('返回 [min, max] 范围内的浮点数', () => {
    for (let i = 0; i < 100; i++) {
      const v = randFloat(0, 1)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('min > max 时抛错', () => {
    expect(() => randFloat(5, 3)).toThrow('randFloat')
  })
})

describe('chance', () => {
  it('probability=1 永远返回 true', () => {
    for (let i = 0; i < 50; i++) {
      expect(chance(1)).toBe(true)
    }
  })

  it('probability=0 永远返回 false', () => {
    for (let i = 0; i < 50; i++) {
      expect(chance(0)).toBe(false)
    }
  })
})

describe('pick', () => {
  it('从数组中随机取一个元素', () => {
    const arr = ['a', 'b', 'c']
    for (let i = 0; i < 30; i++) {
      expect(arr).toContain(pick(arr))
    }
  })

  it('空数组抛错', () => {
    expect(() => pick([])).toThrow('empty array')
  })
})

describe('pickN', () => {
  it('返回 n 个不重复元素', () => {
    const arr = ['a', 'b', 'c', 'd', 'e']
    const result = pickN(arr, 3)
    expect(result).toHaveLength(3)
    expect(new Set(result).size).toBe(3)
  })
})

describe('shuffle', () => {
  it('返回相同长度且包含所有元素', () => {
    const arr = [1, 2, 3, 4, 5]
    const result = shuffle(arr)
    expect(result).toHaveLength(arr.length)
    expect(result.sort()).toEqual(arr.sort())
  })
})

describe('weightedPick', () => {
  it('按权重选择', () => {
    const items: [string, number][] = [['a', 100], ['b', 0]]
    // 高权重项应该被选中（概率极高）
    let aCount = 0
    for (let i = 0; i < 20; i++) {
      if (weightedPick(items) === 'a') aCount++
    }
    expect(aCount).toBe(20) // b 权重为 0，永远不应被选中
  })

  it('空数组抛错', () => {
    expect(() => weightedPick([])).toThrow('empty items')
  })
})

describe('clamp', () => {
  it('限制值在范围内', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(15, 0, 10)).toBe(10)
  })
})

describe('probLabel', () => {
  it('正确分类概率', () => {
    expect(probLabel(0)).toBe('low')
    expect(probLabel(0.3)).toBe('medium')
    expect(probLabel(0.6)).toBe('high')
    expect(probLabel(0.9)).toBe('very_high')
  })
})
