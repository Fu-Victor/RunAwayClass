import type { GamePhase } from './types'

interface PhaseOptions {
  isLastCourse?: boolean
  hasEvent?: boolean
  isLastDay?: boolean
  gameOver?: boolean
}

export function nextPhase(current: GamePhase, opts?: PhaseOptions): GamePhase {
  switch (current) {
    case 'START':
      return 'NIGHT_DECISION'
    case 'NIGHT_DECISION':
      return 'DAWN'
    case 'DAWN':
      return opts?.hasEvent ? 'DAWN_EVENT' : 'DAY_PROGRESSION'
    case 'DAWN_EVENT':
      return 'DAY_PROGRESSION'
    case 'DAY_PROGRESSION':
      if (opts?.hasEvent) return 'EVENT'
      if (opts?.isLastCourse) return 'DAY_SETTLEMENT'
      return 'DAY_PROGRESSION'
    case 'EVENT':
      return opts?.isLastCourse ? 'DAY_SETTLEMENT' : 'DAY_PROGRESSION'
    case 'DAY_SETTLEMENT':
      if (opts?.gameOver) return 'GAME_OVER'
      if (opts?.isLastDay) return 'GAME_WIN'
      return 'NIGHT_DECISION'
    case 'GAME_OVER':
    case 'GAME_WIN':
      return 'START'
    default:
      return 'START'
  }
}

// 自动推进阶段的展示时长（ms），0 表示需玩家交互
export function phaseDuration(phase: GamePhase): number {
  switch (phase) {
    case 'DAWN':
      return 2000
    case 'DAY_PROGRESSION':
      return 2500
    case 'DAY_SETTLEMENT':
      return 3000
    default:
      return 0
  }
}
