/* eslint-disable react-refresh/only-export-components */
/**
 * 游戏状态管理 —— React Context + useReducer
 * 后续可替换为 Zustand / Redux，action 接口保持不变即可
 *
 * TODO: 当后端 API 就绪后：
 *   - 将 generateWeekCourses 替换为 API 调用
 *   - 将 pickRandomEvent 替换为 API 返回的事件
 *   - 将 calculateRating / matchTitle 替换为服务端计算
 */

import { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import { generateWeekCourses, estimateRollCallProbability } from '../data/courses.js'
import { selectAvailableEvents, pickRandomEvent } from '../data/events.js'
import { difficultyConfig, gameThresholds } from '../data/difficulties.js'
import { calculateRating, matchTitle, ratingTones } from '../data/evaluation.js'

// ==================== 常量 ====================
export const PHASES = { MENU: 'menu', DIFFICULTY: 'difficulty', NIGHT: 'night', DAY: 'day', SETTLEMENT: 'settlement', RESULT: 'result' }
export const SCREENS = { MENU: 'menu', DIFFICULTY: 'difficulty', HISTORY: 'history', TITLES: 'titles', CREDITS: 'credits', GAME: 'game' }

export const COURSE_ACTIONS = [
  { key: 'attend', label: '老实上课' },
  { key: 'skip', label: '旷课跑路' },
  { key: 'substitute', label: '帮人代课' },
  { key: 'outsource', label: '找人代课' },
]

export const NIGHT_ACTIONS = [
  { key: 'sleep', label: '早睡养生', delta: { energy: 22, mood: 4, roommate: 5, entertainment: -3 } },
  { key: 'game', label: '熬夜打游戏', delta: { entertainment: 24, energy: -13, mood: 5, roommate: -6 } },
  { key: 'homework', label: '通宵赶作业', delta: { credit: 7, energy: -17, mood: -4 } },
  { key: 'hangout', label: '出去浪', delta: { entertainment: 18, mood: 10, money: -18, energy: -6 } },
  { key: 'normal', label: '正常休息', delta: { energy: 10, fullness: -3, entertainment: 2, mood: 2 } },
]

// ==================== 工具函数 ====================
const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const round = (v) => Math.round(v)

function clampStats(stats) {
  const result = { ...stats }
  Object.keys(result).forEach((key) => {
    if (key === 'money') result[key] = clamp(result[key], 0, 999)
    else result[key] = clamp(result[key], 0, 100)
  })
  return result
}

function makeInitialCoursePlan(courses) {
  return courses.reduce((plan, c) => ({ ...plan, [c.id]: 'attend' }), {})
}

// ==================== 初始状态 ====================
const normalInit = difficultyConfig.normal.initialStats

const initialState = {
  // 界面
  screen: SCREENS.MENU,
  difficulty: 'normal',

  // 数值
  stats: { ...normalInit },

  // 进度
  day: 1,
  phase: PHASES.NIGHT,
  currentCourse: 0,
  skipCount: 0,
  substituteCount: 0,
  outsourceCount: 0,

  // 课程
  courses: generateWeekCourses('normal'),

  // 决策
  coursePlan: {},
  nightPlan: 'normal',
  todayPlan: {},

  // 事件
  currentEvent: null,
  usedEventIds: [],

  // 历史
  history: ['欢迎来到逃课模拟器，今天也要体面地活着。'],
  dailyLogs: [],

  // 手机
  phoneTab: 'home',

  // 每日心情快照（用于结算评价）
  moodSnapshots: [],

  // 结算
  result: null,
}

// ==================== Reducer ====================
function gameReducer(state, action) {
  switch (action.type) {
    // —— 界面导航 ——
    case 'SET_SCREEN':
      return { ...state, screen: action.payload }

    // —— 开始游戏 ——
    case 'START_GAME': {
      const diff = action.payload
      const config = difficultyConfig[diff]
      const courses = generateWeekCourses(diff)
      return {
        ...initialState,
        screen: SCREENS.GAME,
        difficulty: diff,
        stats: { ...config.initialStats },
        courses,
        coursePlan: makeInitialCoursePlan(courses.filter((c) => c.day === 1)),
        todayPlan: {},
        history: [`已选择${config.label}难度，教务系统开始露出微笑。`],
      }
    }

    // —— 修改数值 ——
    case 'PATCH_STATS': {
      const delta = action.payload
      const config = difficultyConfig[state.difficulty]
      // 应用难度倍率
      const adjusted = { ...delta }
      if (adjusted.credit > 0) adjusted.credit = round(adjusted.credit * config.modifiers.creditGain)
      if (adjusted.credit < 0) adjusted.credit = round(adjusted.credit * config.modifiers.creditLoss)
      if (adjusted.energy < 0) adjusted.energy = round(adjusted.energy * config.modifiers.energyDrain)
      if (adjusted.fullness < 0) adjusted.fullness = round(adjusted.fullness * config.modifiers.fullnessDrain)
      if (adjusted.entertainment < 0) adjusted.entertainment = round(adjusted.entertainment * config.modifiers.entertainmentDrain)

      const next = { ...state.stats }
      Object.entries(adjusted).forEach(([k, v]) => {
        next[k] = (next[k] || 0) + v
      })
      return { ...state, stats: clampStats(next) }
    }

    // —— 增减计数器 ——
    case 'INCREMENT_COUNTER': {
      const key = action.payload
      return { ...state, [key]: state[key] + 1 }
    }

    // —— 设置课程计划 ——
    case 'SET_COURSE_PLAN':
      return {
        ...state,
        coursePlan: { ...state.coursePlan, [action.payload.courseId]: action.payload.actionKey },
      }

    // —— 设置夜间计划 ——
    case 'SET_NIGHT_PLAN':
      return { ...state, nightPlan: action.payload }

    // —— 设置手机Tab ——
    case 'SET_PHONE_TAB':
      return { ...state, phoneTab: action.payload }

    // —— 提交夜间计划、进入白天 ——
    case 'SUBMIT_NIGHT': {
      const nightAction = NIGHT_ACTIONS.find((a) => a.key === state.nightPlan)
      const config = difficultyConfig[state.difficulty]
      const adjustedDelta = { ...nightAction.delta }
      if (adjustedDelta.energy > 0) adjustedDelta.energy = round(adjustedDelta.energy)
      if (adjustedDelta.energy < 0) adjustedDelta.energy = round(adjustedDelta.energy * config.modifiers.energyDrain)

      const nextStats = { ...state.stats }
      Object.entries(adjustedDelta).forEach(([k, v]) => {
        nextStats[k] = (nextStats[k] || 0) + v
      })

      // 启动当天计划
      const todayPlan = { ...state.coursePlan }

      return {
        ...state,
        stats: clampStats(nextStats),
        phase: PHASES.DAY,
        currentCourse: 0,
        todayPlan,
        history: [`今晚选择：${nightAction.label}。明天的锅已经预约成功。`, ...state.history].slice(0, 8),
      }
    }

    // —— 推进课程 ——
    case 'ADVANCE_COURSE': {
      const { delta, text, shouldCheckEvent } = action.payload
      const config = difficultyConfig[state.difficulty]

      // 应用难度倍率
      const adjusted = { ...delta }
      if (adjusted.credit > 0) adjusted.credit = round(adjusted.credit * config.modifiers.creditGain)
      if (adjusted.credit < 0) adjusted.credit = round(adjusted.credit * config.modifiers.creditLoss)
      if (adjusted.energy < 0) adjusted.energy = round(adjusted.energy * config.modifiers.energyDrain)

      const nextStats = { ...state.stats }
      Object.entries(adjusted).forEach(([k, v]) => {
        nextStats[k] = (nextStats[k] || 0) + v
      })

      const newState = {
        ...state,
        stats: clampStats(nextStats),
        history: [text, ...state.history].slice(0, 8),
      }

      // 检查是否需要触发事件
      if (shouldCheckEvent) {
        const todayPlan = state.todayPlan || {}
        const availableEvents = selectAvailableEvents({
          stats: newState.stats,
          todayPlan,
          day: state.day,
          skipCount: state.skipCount,
          difficulty: state.difficulty,
        })
        const freshEvents = availableEvents.filter((e) => !state.usedEventIds.includes(e.id))
        const picked = freshEvents.length > 0 ? pickRandomEvent(freshEvents) : null

        if (picked) {
          return {
            ...newState,
            currentEvent: picked,
            usedEventIds: [...state.usedEventIds, picked.id],
          }
        }
      }
      // 下一节课或进入结算
      if (state.currentCourse < 8) {
        return { ...newState, currentCourse: state.currentCourse + 1 }
      }
      return { ...newState, phase: PHASES.SETTLEMENT }
    }

    // —— 解决事件 ——
    case 'RESOLVE_EVENT': {
      const { delta, text } = action.payload
      const config = difficultyConfig[state.difficulty]
      const adjusted = { ...delta }
      if (adjusted.credit > 0) adjusted.credit = round(adjusted.credit * config.modifiers.creditGain)
      if (adjusted.credit < 0) adjusted.credit = round(adjusted.credit * config.modifiers.creditLoss)

      const nextStats = { ...state.stats }
      Object.entries(adjusted).forEach(([k, v]) => {
        nextStats[k] = (nextStats[k] || 0) + v
      })

      const newState = {
        ...state,
        stats: clampStats(nextStats),
        currentEvent: null,
        history: [text, ...state.history].slice(0, 8),
      }

      if (state.currentCourse < 8) {
        return { ...newState, currentCourse: state.currentCourse + 1 }
      }
      return { ...newState, phase: PHASES.SETTLEMENT }
    }

    // —— 每日结算 ——
    case 'SETTLE_DAY': {
      const config = difficultyConfig[state.difficulty]
      const { mood: currentMood, energy, fullness, entertainment } = state.stats

      // 心情日结算：三项加权平均与期望值比较
      const avgSecondary = (energy + fullness + entertainment) / 3
      const moodDelta = round((avgSecondary - config.modifiers.moodThreshold) / 10)
      const nextStats = { ...state.stats, mood: clamp(currentMood + moodDelta, 0, 100) }

      const moodSnapshot = [...state.moodSnapshots, nextStats.mood]

      // 检查是否通关/失败
      if (state.day >= 7) {
        const isCleared = nextStats.mood > gameThresholds.moodCrash && nextStats.credit >= gameThresholds.creditPass
        const isFailed = nextStats.mood <= gameThresholds.moodCrash

        if (isCleared || isFailed) {
          const skipRate = state.skipCount / 63
          const rating = isCleared ? calculateRating(nextStats, skipRate, 7) : null
          const titleInfo = matchTitle(rating, nextStats, isFailed)

          return {
            ...state,
            stats: nextStats,
            moodSnapshots: moodSnapshot,
            phase: PHASES.RESULT,
            result: {
              cleared: isCleared,
              failed: isFailed,
              rating,
              title: titleInfo.title,
              desc: titleInfo.desc,
              tone: rating ? ratingTones[rating] : '',
            },
            history: [
              isCleared
                ? `通关！评级 ${rating} —— ${titleInfo.title}：${titleInfo.desc}`
                : `失败！${titleInfo.title}：${titleInfo.desc}`,
              ...state.history,
            ].slice(0, 8),
          }
        }
      }

      // 进入下一天
      const nextDay = state.day + 1
      const nextDayCourses = state.courses.filter((c) => c.day === nextDay)

      return {
        ...state,
        stats: nextStats,
        day: nextDay,
        phase: PHASES.NIGHT,
        currentCourse: 0,
        moodSnapshots: moodSnapshot,
        coursePlan: makeInitialCoursePlan(nextDayCourses),
        todayPlan: {},
        nightPlan: 'normal',
        usedEventIds: [],
        history: [
          `第 ${state.day} 天结算：你还活着，真是奇迹。心情${moodDelta >= 0 ? '+' : ''}${moodDelta}`,
          ...state.history,
        ].slice(0, 8),
      }
    }

    // —— 添加历史记录 ——
    case 'ADD_HISTORY':
      return {
        ...state,
        history: [action.payload, ...state.history].slice(0, 8),
      }

    // —— 返回菜单 ——
    case 'RESET':
      return initialState

    default:
      return state
  }
}

// ==================== Context ====================
const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  // 当天课程
  const todayCourses = useMemo(
    () => state.courses.filter((c) => c.day === state.day),
    [state.courses, state.day]
  )

  // 当前课程
  const currentCourse = useMemo(
    () => todayCourses[state.currentCourse] || todayCourses[0],
    [todayCourses, state.currentCourse]
  )

  // 是否游戏结束
  const isGameOver = state.stats.mood <= gameThresholds.moodCrash
  const isCleared = state.phase === PHASES.RESULT && state.result?.cleared

  // 带上下文的课程点名概率估算
  const coursesWithEstimate = useMemo(
    () =>
      todayCourses.map((c) => ({
        ...c,
        estimatedRollCall: estimateRollCallProbability(c, state.skipCount),
      })),
    [todayCourses, state.skipCount]
  )

  // ===== Actions =====
  const actions = {
    startGame: useCallback(
      (difficulty) => dispatch({ type: 'START_GAME', payload: difficulty }),
      []
    ),
    setScreen: useCallback((screen) => dispatch({ type: 'SET_SCREEN', payload: screen }), []),
    patchStats: useCallback((delta) => dispatch({ type: 'PATCH_STATS', payload: delta }), []),
    setCoursePlan: useCallback(
      (courseId, actionKey) =>
        dispatch({ type: 'SET_COURSE_PLAN', payload: { courseId, actionKey } }),
      []
    ),
    setNightPlan: useCallback((key) => dispatch({ type: 'SET_NIGHT_PLAN', payload: key }), []),
    setPhoneTab: useCallback((tab) => dispatch({ type: 'SET_PHONE_TAB', payload: tab }), []),
    addHistory: useCallback((text) => dispatch({ type: 'ADD_HISTORY', payload: text }), []),
    reset: useCallback(() => dispatch({ type: 'RESET' }), []),

    // 提交夜间计划
    submitNight: useCallback(() => dispatch({ type: 'SUBMIT_NIGHT' }), []),

    // 推进课程（delta + text + 是否检查事件）
    advanceCourse: useCallback(
      (delta, text, shouldCheckEvent) =>
        dispatch({ type: 'ADVANCE_COURSE', payload: { delta, text, shouldCheckEvent } }),
      []
    ),

    // 解决事件
    resolveEvent: useCallback(
      (delta, text) => dispatch({ type: 'RESOLVE_EVENT', payload: { delta, text } }),
      []
    ),

    // 每日结算
    settleDay: useCallback(() => dispatch({ type: 'SETTLE_DAY' }), []),

    // 增加计数器
    incrementCounter: useCallback(
      (key) => dispatch({ type: 'INCREMENT_COUNTER', payload: key }),
      []
    ),
  }

  const value = useMemo(
    () => ({
      ...state,
      todayCourses,
      coursesWithEstimate,
      currentCourse,
      isGameOver,
      isCleared,
      ...actions,
      difficultyModifiers: difficultyConfig[state.difficulty]?.modifiers || difficultyConfig.normal.modifiers,
    }),
    [state, todayCourses, coursesWithEstimate, currentCourse, isGameOver, isCleared, actions]
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

// ==================== Hook ====================
export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within a GameProvider')
  return ctx
}

export { gameThresholds, difficultyConfig }
