import type { Difficulty, GameState } from './types'
import { DEFAULT_THRESHOLDS, DIFFICULTY_CONFIGS } from './constants'
import { generateCourses } from './courseGen'

export function createInitialState(difficulty: Difficulty): GameState {
  const config = DIFFICULTY_CONFIGS[difficulty]
  return {
    phase: 'START',
    day: 1,
    courseIndex: 0,
    stats: { ...config.initialStats },
    thresholds: { ...DEFAULT_THRESHOLDS[difficulty] },
    difficulty,
    difficultyConfig: config,
    courses: generateCourses(config),
    decisions: [],
    currentDecision: null,
    activeEvent: null,
    history: [],
    pendingDeltas: {},
    usedEventIds: [],
    showWarning: false,
    totalSkipCount: 0,
  }
}

export function cloneState(state: GameState): GameState {
  return structuredClone(state) as GameState
}
