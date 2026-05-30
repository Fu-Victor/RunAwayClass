/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useMemo } from 'react'
import { createInitialState } from '../engine/state'
import { DIFFICULTY_CONFIGS, DEFAULT_THRESHOLDS, TIME_SLOTS } from '../engine/constants'
import { resolveCourseAction, resolveDawnAction, resolveFreeSlotAction } from '../engine/actions'
import { findEligibleEvents, tryTriggerEvent, resolveEventOption } from '../engine/events'
import { settleDay, applyDeltas } from '../engine/settlement'
import { evaluate, evaluateFailure } from '../engine/evaluation'
import { finalizeCourses, getEstimatedProbLabel } from '../engine/courseGen'
import { eventPool, courseNames, teacherNames } from '../content/loader'

export const PHASES = { MENU: 'menu', DIFFICULTY: 'difficulty', NIGHT: 'night', DAY: 'day', SETTLEMENT: 'settlement', RESULT: 'result' }
export const SCREENS = { MENU: 'menu', DIFFICULTY: 'difficulty', HISTORY: 'history', TITLES: 'titles', CREDITS: 'credits', GAME: 'game' }

export const COURSE_ACTIONS = [
  { key: 'attend', label: '老实上课', color: '#79b8f5' },
  { key: 'skip', label: '旷课跑路', color: '#f06db7' },
  { key: 'sub_for_other', label: '帮人代课', color: '#61e5e6' },
  { key: 'hire_sub', label: '找人代课', color: '#ffa36b' },
]

export const FREE_ACTIONS = [
  { key: 'self_study', label: '自习', color: '#79b8f5' },
  { key: 'rest', label: '补觉', color: '#9b61f5' },
  { key: 'eat', label: '吃饭', color: '#83d77a' },
  { key: 'entertain', label: '摸鱼', color: '#ffd772' },
]

export const DAWN_ACTIONS = [
  { key: 'sleep_early', label: '早睡养生' },
  { key: 'gaming', label: '熬夜打游戏' },
  { key: 'cram', label: '通宵赶作业' },
  { key: 'go_out', label: '出去浪' },
  { key: 'normal_rest', label: '正常休息' },
]

export const periodGroups = [
  { key: 'morning', label: '早上', slots: [0, 1, 2], color: '#f5c84c' },
  { key: 'afternoon', label: '下午', slots: [3, 4, 5], color: '#ff9a76' },
  { key: 'evening', label: '晚上', slots: [6, 7, 8], color: '#5a86ff' },
]

function clampStats(stats) {
  const r = { ...stats }
  for (const k of Object.keys(r)) {
    if (k === 'money' || k === 'credits') r[k] = Math.max(0, Math.min(999, r[k]))
    else r[k] = Math.max(0, Math.min(100, r[k]))
  }
  return r
}

function transformToFlat(courses2D) {
  const flat = []
  for (let day = 0; day < courses2D.length; day++) {
    const daySlots = courses2D[day] || []
    for (let slot = 0; slot < daySlots.length; slot++) {
      const c = daySlots[slot]
      if (c) {
        flat.push({
          id: c.id,
          day: day + 1,
          slot,
          name: c.name,
          teacher: c.teacher.name,
          teacherTrait: c.teacher.trait,
          teacherSpecial: c.teacher.special,
          type: c.type === 'serious' ? '正课' : '水课',
          engineType: c.type,
          timeSlotIndex: c.timeSlotIndex,
          time: TIME_SLOTS[slot],
          period: slot < 3 ? '早上' : slot < 6 ? '下午' : '晚上',
          group: slot < 3 ? 'morning' : slot < 6 ? 'afternoon' : 'evening',
          isFree: false,
        })
      } else {
        flat.push({
          id: `free-d${day}-s${slot}`,
          day: day + 1,
          slot,
          name: '休息',
          teacher: '-',
          teacherTrait: null,
          teacherSpecial: null,
          type: '水课',
          engineType: 'easy',
          timeSlotIndex: slot,
          time: TIME_SLOTS[slot],
          period: slot < 3 ? '早上' : slot < 6 ? '下午' : '晚上',
          group: slot < 3 ? 'morning' : slot < 6 ? 'afternoon' : 'evening',
          isFree: true,
        })
      }
    }
  }
  return flat
}

function makeDefaultPlan(dayCourses) {
  const plan = {}
  const slotDecisions = {}
  for (const c of dayCourses) {
    const a = c.isFree ? 'rest' : 'attend'
    plan[c.id] = a
    slotDecisions[c.slot] = a
  }
  return { plan, slotDecisions }
}

function getThresholds(difficulty) {
  return DEFAULT_THRESHOLDS[difficulty]
}

function buildEngineState(ctx) {
  return {
    phase: ctx.phase || 'START',
    day: ctx.day,
    courseIndex: ctx.currentCourse,
    stats: ctx.stats,
    thresholds: getThresholds(ctx.difficulty),
    difficulty: ctx.difficulty,
    difficultyConfig: DIFFICULTY_CONFIGS[ctx.difficulty],
    courses: [],
    decisions: [],
    currentDecision: null,
    activeEvent: null,
    history: [],
    pendingDeltas: {},
    usedEventIds: ctx.usedEventIds,
    showWarning: false,
    totalSkipCount: ctx.skipCount,
  }
}

const normalInit = DIFFICULTY_CONFIGS.normal.initialStats

const initialState = {
  screen: SCREENS.MENU,
  difficulty: 'normal',
  stats: { ...normalInit },
  day: 1,
  phase: PHASES.NIGHT,
  currentCourse: 0,
  skipCount: 0,
  courses: [],
  coursePlan: {},
  slotDecisions: {},
  dawnAction: 'normal_rest',
  currentEvent: null,
  usedEventIds: [],
  history: ['欢迎来到逃课模拟器，今天也要体面地活着。'],
  dailyLogs: [],
  phoneTab: 'home',
  moodSnapshots: [],
  result: null,
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload }

    case 'START_GAME': {
      const diff = action.payload
      const es = createInitialState(diff)
      finalizeCourses(es.courses, courseNames, teacherNames)
      const flatCourses = transformToFlat(es.courses)
      const day1Courses = flatCourses.filter((c) => c.day === 1)
      const { plan, slotDecisions } = makeDefaultPlan(day1Courses)
      return {
        ...initialState,
        screen: SCREENS.GAME,
        difficulty: diff,
        stats: { ...es.stats },
        courses: flatCourses,
        coursePlan: plan,
        slotDecisions,
        day: 1,
        phase: PHASES.NIGHT,
        dawnAction: 'normal_rest',
        history: [`已选择${diff}难度，教务系统开始露出微笑。`],
      }
    }

    case 'SET_COURSE_PLAN': {
      const { courseId, actionKey } = action.payload
      if (state.phase !== PHASES.NIGHT) return state
      const course = state.courses.find((c) => c.id === courseId)
      if (!course) return state
      return {
        ...state,
        coursePlan: { ...state.coursePlan, [courseId]: actionKey },
        slotDecisions: { ...state.slotDecisions, [course.slot]: actionKey },
      }
    }

    case 'SET_DAWN_ACTION':
      if (state.phase !== PHASES.NIGHT) return state
      return { ...state, dawnAction: action.payload }

    case 'SUBMIT_NIGHT': {
      const dawnResult = resolveDawnAction(state.dawnAction)
      const nextStats = applyDeltas(state.stats, dawnResult.deltas)
      return {
        ...state,
        stats: clampStats(nextStats),
        phase: PHASES.DAY,
        currentCourse: 0,
        history: [dawnResult.description, ...state.history].slice(0, 8),
      }
    }

    case 'ADVANCE_COURSE': {
      const todayCourses = state.courses.filter((c) => c.day === state.day)
      const course = todayCourses[state.currentCourse]
      if (!course) {
        return { ...state, phase: PHASES.SETTLEMENT }
      }

      const config = DIFFICULTY_CONFIGS[state.difficulty]
      const actionKey = state.coursePlan[course.id] || (course.isFree ? 'rest' : 'attend')

      let result
      if (course.isFree) {
        result = resolveFreeSlotAction(actionKey)
      } else {
        const engineCourse = {
          id: course.id,
          name: course.name,
          type: course.engineType,
          teacher: {
            name: course.teacher,
            trait: course.teacherTrait || 'roll_call_hater',
            special: course.teacherSpecial || null,
          },
          timeSlotIndex: course.timeSlotIndex,
        }
        result = resolveCourseAction(actionKey, engineCourse, state.stats, state.skipCount, config)
      }

      const nextStats = applyDeltas(state.stats, result.deltas)
      const newSkipCount = actionKey === 'skip' ? state.skipCount + 1 : state.skipCount

      const afterCourse = {
        ...state,
        stats: clampStats(nextStats),
        skipCount: newSkipCount,
        history: [result.description, ...state.history].slice(0, 8),
      }

      const es = buildEngineState(afterCourse)
      const eligible = findEligibleEvents(eventPool, es, 'course_break')
      const fresh = eligible.filter((e) => !state.usedEventIds.includes(e.id))
      const picked = tryTriggerEvent(fresh)
      if (picked) {
        return {
          ...afterCourse,
          currentEvent: picked,
          usedEventIds: [...state.usedEventIds, picked.id],
        }
      }

      if (state.currentCourse < 8) {
        return { ...afterCourse, currentCourse: state.currentCourse + 1 }
      }
      return { ...afterCourse, phase: PHASES.SETTLEMENT }
    }

    case 'RESOLVE_EVENT': {
      const { optionIndex } = action.payload
      const event = state.currentEvent
      if (!event) return state
      const resolved = resolveEventOption(event, optionIndex)
      const nextStats = applyDeltas(state.stats, resolved.deltas)

      const afterEvent = {
        ...state,
        stats: clampStats(nextStats),
        currentEvent: null,
        history: [resolved.flavorText, ...state.history].slice(0, 8),
      }

      if (state.currentCourse < 8) {
        return { ...afterEvent, currentCourse: state.currentCourse + 1 }
      }
      return { ...afterEvent, phase: PHASES.SETTLEMENT }
    }

    case 'SETTLE_DAY': {
      const es = buildEngineState(state)
      const settlement = settleDay(es)
      const nextStats = applyDeltas(state.stats, settlement.deltas)
      const moodSnapshot = [...state.moodSnapshots, nextStats.mood]

      if (state.day >= 7 || settlement.gameOver) {
        const thresholds = getThresholds(state.difficulty)
        const isFailed = settlement.gameOver
        const isCleared = !isFailed && nextStats.credits >= thresholds.passCredits

        let ev
        if (isFailed) {
          ev = evaluateFailure(nextStats)
        } else if (isCleared) {
          const evalCtx = buildEngineState({ ...state, stats: nextStats, day: 7, phase: 'GAME_WIN' })
          ev = evaluate(evalCtx)
        } else {
          ev = evaluateFailure(nextStats)
        }

        return {
          ...state,
          stats: nextStats,
          moodSnapshots: moodSnapshot,
          phase: PHASES.RESULT,
          result: {
            cleared: isCleared,
            failed: !isCleared,
            rating: ev.rating,
            title: ev.title,
            desc: ev.comment,
            tone: '',
          },
          history: [
            isFailed
              ? `失败！${ev.title}：${ev.comment}`
              : isCleared
                ? `通关！评级 ${ev.rating} —— ${ev.title}：${ev.comment}`
                : `失败！学分不足，${ev.title}：${ev.comment}`,
            ...state.history,
          ].slice(0, 8),
        }
      }

      const nextDay = state.day + 1
      const nextDayCourses = state.courses.filter((c) => c.day === nextDay)
      const { plan, slotDecisions } = makeDefaultPlan(nextDayCourses)

      return {
        ...state,
        stats: nextStats,
        day: nextDay,
        phase: PHASES.NIGHT,
        currentCourse: 0,
        moodSnapshots: moodSnapshot,
        coursePlan: plan,
        slotDecisions,
        dawnAction: 'normal_rest',
        usedEventIds: [],
        history: [
          settlement.description || `第 ${state.day} 天结算：你还活着，真是奇迹。`,
          ...state.history,
        ].slice(0, 8),
      }
    }

    case 'ADD_HISTORY':
      return { ...state, history: [action.payload, ...state.history].slice(0, 8) }

    case 'SET_PHONE_TAB':
      return { ...state, phoneTab: action.payload }

    case 'PATCH_STATS':
      return { ...state, stats: clampStats(applyDeltas(state.stats, action.payload)) }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const todayCourses = useMemo(
    () => state.courses.filter((c) => c.day === state.day),
    [state.courses, state.day],
  )

  const currentCourse = useMemo(
    () => todayCourses[state.currentCourse] || todayCourses[0],
    [todayCourses, state.currentCourse],
  )

  const isGameOver = state.stats.mood <= 0
  const isCleared = state.phase === PHASES.RESULT && state.result?.cleared

  const coursesWithEstimate = useMemo(() => {
    const config = DIFFICULTY_CONFIGS[state.difficulty]
    return todayCourses.map((c) => {
      if (c.isFree) return { ...c, estimatedRollCall: '低' }
      const engineCourse = {
        id: c.id,
        name: c.name,
        type: c.engineType,
        teacher: {
          name: c.teacher,
          trait: c.teacherTrait || 'roll_call_hater',
          special: c.teacherSpecial || null,
        },
        timeSlotIndex: c.timeSlotIndex,
      }
      const prob = getEstimatedProbLabel(engineCourse, state.skipCount, config)
      const labelMap = { low: '低', medium: '中', high: '高', very_high: '极高' }
      return { ...c, estimatedRollCall: labelMap[prob] || '中' }
    })
  }, [todayCourses, state.skipCount, state.difficulty])

  const actions = useMemo(() => ({
    startGame: (d) => dispatch({ type: 'START_GAME', payload: d }),
    setScreen: (s) => dispatch({ type: 'SET_SCREEN', payload: s }),
    patchStats: (d) => dispatch({ type: 'PATCH_STATS', payload: d }),
    setCoursePlan: (courseId, actionKey) => dispatch({ type: 'SET_COURSE_PLAN', payload: { courseId, actionKey } }),
    setDawnAction: (k) => dispatch({ type: 'SET_DAWN_ACTION', payload: k }),
    setPhoneTab: (t) => dispatch({ type: 'SET_PHONE_TAB', payload: t }),
    addHistory: (t) => dispatch({ type: 'ADD_HISTORY', payload: t }),
    reset: () => dispatch({ type: 'RESET' }),
    submitNight: () => dispatch({ type: 'SUBMIT_NIGHT' }),
    advanceCourse: () => dispatch({ type: 'ADVANCE_COURSE' }),
    resolveEvent: (optionIndex) => dispatch({ type: 'RESOLVE_EVENT', payload: { optionIndex } }),
    settleDay: () => dispatch({ type: 'SETTLE_DAY' }),
  }), [])

  const value = useMemo(
    () => ({
      ...state,
      todayCourses,
      coursesWithEstimate,
      currentCourse,
      isGameOver,
      isCleared,
      ...actions,
      gameThresholds: {
        creditPass: getThresholds(state.difficulty).passCredits,
        creditWarning: getThresholds(state.difficulty).warningCredits,
        creditTutor: getThresholds(state.difficulty).tutorCredits,
        moodCrash: getThresholds(state.difficulty).crashMood,
      },
      difficultyConfig: DIFFICULTY_CONFIGS[state.difficulty] || DIFFICULTY_CONFIGS.normal,
    }),
    [state, todayCourses, coursesWithEstimate, currentCourse, isGameOver, isCleared, actions],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within a GameProvider')
  return ctx
}
