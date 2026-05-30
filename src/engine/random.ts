export function randInt(min: number, max: number): number {
  if (min > max) throw new Error(`randInt: min(${min}) > max(${max})`)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randFloat(min: number, max: number): number {
  if (min > max) throw new Error(`randFloat: min(${min}) > max(${max})`)
  return Math.random() * (max - min) + min
}

export function chance(probability: number): boolean {
  return Math.random() < probability
}

export function pick<T>(arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('pick: empty array')
  return arr[Math.floor(Math.random() * arr.length)]
}

export function pickN<T>(arr: readonly T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

// Fisher-Yates 洗牌
export function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function weightedPick<T>(items: readonly [T, number][]): T {
  if (items.length === 0) throw new Error('weightedPick: empty items')
  const total = items.reduce((sum, [, w]) => sum + w, 0)
  let r = Math.random() * total
  for (const [value, weight] of items) {
    r -= weight
    if (r <= 0) return value
  }
  return items[items.length - 1][0]
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function probLabel(prob: number): 'low' | 'medium' | 'high' | 'very_high' {
  if (prob < 0.25) return 'low'
  if (prob < 0.5) return 'medium'
  if (prob < 0.75) return 'high'
  return 'very_high'
}
