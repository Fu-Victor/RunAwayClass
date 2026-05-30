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
    usedEventIds: new Set(),
    showWarning: false,
  }
}

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    stats: { ...state.stats },
    thresholds: { ...state.thresholds },
    difficultyConfig: { ...state.difficultyConfig },
    courses: state.courses.map(day =>
      day.map(c => ({ ...c, teacher: { ...c.teacher } })),
    ),
    decisions: state.decisions.map(d => ({
      ...d,
      courseActions: [...d.courseActions],
    })),
    currentDecision: state.currentDecision
      ? { ...state.currentDecision, courseActions: [...state.currentDecision.courseActions] }
      : null,
    activeEvent: state.activeEvent
      ? {
          ...state.activeEvent,
          options: state.activeEvent.options.map(o => ({
            ...o,
            effects: { ...o.effects },
          })),
        }
      : null,
    history: [...state.history],
    pendingDeltas: { ...state.pendingDeltas },
    usedEventIds: new Set(state.usedEventIds),
  }
}
