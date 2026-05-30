// ==================== 常量 ====================

/** 次要状态通用上限 */
export const MAX_REST = 100
export const MAX_HUNGER = 100
export const MAX_ENTERTAINMENT = 100
export const MAX_ROOMMATE_FAVORABILITY = 100

/** 心情通用上限 */
export const MAX_MOOD = 150

// ==================== 时间系统 ====================

export type WeekDay = '周一' | '周二' | '周三' | '周四' | '周五' | '周六' | '周日'

export type TimePeriod = '早晨' | '中午' | '下午' | '晚上' | '半夜'

export type TimeSlot =
  | '6-8' | '8-10' | '10-12'       // 早晨
  | '12-14' | '14-16' | '16-18'    // 中午
  | '18-20' | '20-22' | '22-24'    // 晚上
  | '0-2' | '2-4' | '4-6'          // 半夜

// ==================== 课程系统 ====================

export type CourseType = '水课' | '正课'

export type TeacherTendency = '爱点名' | '不爱点名'

export interface Course {
  id: string
  name: string
  type: CourseType
  teacherTendency: TeacherTendency
  timeSlot: TimeSlot
}

// ==================== 活动系统 ====================

export type ActivityType = '休息' | '饮食' | '娱乐' | '上课' | '打工' | '代课'

export interface ScheduleEntry {
  timeSlot: TimeSlot
  activity: ActivityType
  course?: Course
}

export interface DailySchedule {
  day: WeekDay
  entries: ScheduleEntry[]
}

// ==================== 玩家状态 ====================

export interface PlayerStats {
  credit: number
  mood: number
  money: number
  rest: number
  hunger: number
  entertainment: number
  roommateFavorability: number
}

/** 状态变化量（用于增/减操作） */
export type StatsDelta = Partial<Record<keyof PlayerStats, number>>

// ==================== 状态阈值 ====================

export interface StatThresholds {
  creditPass: number
  creditTutor: number
  moodCrash: number
  moodExpected: number
  moodHigh: number
  expectedRest: number
  expectedHunger: number
  expectedEntertainment: number
}

// ==================== 难度系统 ====================

export type Difficulty = 'easy' | 'normal' | 'hard'

export interface DifficultyConfig {
  level: Difficulty
  totalDays: number
  enableMoney: boolean
  enableSubstitute: boolean
  enablePartTimeJob: boolean
  enableRoommate: boolean
  initialStats: PlayerStats
  thresholds: StatThresholds
}

// ==================== 概率事件 ====================

export type EventOutcome = 'positive' | 'negative' | 'neutral'

export interface RandomEvent {
  id: string
  activity: ActivityType
  outcome: EventOutcome
  description: string
  effects: StatsDelta
  probability: number
}

// ==================== Buff/Debuff ====================

export interface BuffDefinition {
  id: string
  name: string
  description: string
  type: 'buff' | 'debuff'
  effects: StatsDelta
  duration: number
}

// ==================== 点名概率 ====================

export interface RollCallFactors {
  courseType: CourseType
  teacherTendency: TeacherTendency
  timeSlot: TimeSlot
  isSkipClass: boolean
}

// ==================== 游戏全局 ====================

export type GamePhase = 'setup' | 'playing' | 'dayEnd' | 'gameOver' | 'win'

export interface GameState {
  phase: GamePhase
  difficulty: DifficultyConfig
  player: PlayerStats
  activeBuffs: BuffDefinition[]
  currentDay: number
  currentTimeSlot: TimeSlot
  schedule: DailySchedule[]
  courses: Course[]
  events: RandomEvent[]
}
