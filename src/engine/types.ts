// 玩家七维数值
export interface PlayerStats {
  credits: number
  mood: number
  energy: number
  hunger: number
  entertainment: number
  money: number
  // 舍友好感度，影响旷课掩护概率和社交事件触发
  roommateFavor: number
}

export type StatsDelta = Partial<PlayerStats>

// 各阈值 — 不同难度下数值不同
export interface Thresholds {
  // 第7天结算时 credits 需 >= 此值方可通关
  passCredits: number
  // credits 低于此值时触发教务警告（应 < passCredits，提前预警）
  warningCredits: number
  // credits 高于此值时解锁"家教"行为
  tutorCredits: number
  // mood <= 此值立即失败
  crashMood: number
  // 精力/饱腹/娱乐的每日期望均值，低于则扣心情
  expectedAvg: number
}

export type Difficulty = 'easy' | 'normal' | 'hard'

export interface DifficultyConfig {
  initialStats: PlayerStats
  // 9 个时段中有课程的比例，1.0 = 满课
  courseDensity: number
  // 正课生成比例 0-1
  courseSeriousRatio: number
  // 点名概率全局偏移 -0.3 ~ +0.3
  rollCallBias: number
  // 正面事件概率偏移
  eventPositiveBias: number
  // 所有行为收益的全局倍率
  rewardMultiplier: number
}

export type CourseType = 'easy' | 'serious'

export type TeacherTrait = 'roll_call_lover' | 'roll_call_hater'

export type TeacherSpecial =
  | 'quiz_master'
  | 'scripture_master'
  | 'handwriting_only'
  | null

export interface Teacher {
  name: string
  trait: TeacherTrait
  // 低概率附加，影响该课专属事件池
  special: TeacherSpecial
}

export interface Course {
  id: string
  name: string
  type: CourseType
  teacher: Teacher
  // 0-8，对应 TIME_SLOTS 下标
  timeSlotIndex: number
}

export type CourseAction = 'attend' | 'skip' | 'sub_for_other' | 'hire_sub'

// 空闲时段的行为选择（无课程时）
export type FreeAction = 'self_study' | 'rest' | 'eat' | 'entertain'

export type DawnAction = 'sleep_early' | 'gaming' | 'cram' | 'go_out' | 'normal_rest'

// 每日决策：9 个时段的课程行为 + 空闲行为 + 次日凌晨行为
export interface DayDecision {
  courseActions: CourseAction[]
  freeActions: FreeAction[]
  dawnAction: DawnAction
}

// 工厂函数：确保两个 actions 数组长度 === slotCount
export function createDayDecision(
  courseActions: CourseAction[],
  freeActions: FreeAction[],
  dawnAction: DawnAction,
  slotCount: number,
): DayDecision {
  if (courseActions.length !== slotCount || freeActions.length !== slotCount) {
    throw new Error(`createDayDecision: expected ${slotCount} actions, got c:${courseActions.length} f:${freeActions.length}`)
  }
  return { courseActions, freeActions, dawnAction }
}

export interface EventOption {
  text: string
  effects: StatsDelta
  // 玩家选择后展示的反馈文案
  flavorText: string
}

export interface GameEvent {
  id: string
  phase: 'dawn' | 'course_break'
  // 触发条件表达式，由 events.ts 的 parseCondition 解析
  condition: string
  title: string
  description: string
  options: EventOption[]
}

export type GamePhase =
  | 'START'
  | 'NIGHT_DECISION'
  | 'DAWN'
  | 'DAWN_EVENT'
  | 'DAY_PROGRESSION'
  | 'EVENT'
  | 'DAY_SETTLEMENT'
  | 'GAME_OVER'
  | 'GAME_WIN'

export interface HistoryEntry {
  day: number
  time: string
  description: string
  deltas: StatsDelta
}

export type Rating = 'S' | 'A' | 'B' | 'C' | 'D'

export interface Evaluation {
  rating: Rating
  title: string
  comment: string
}

export interface GameState {
  phase: GamePhase
  day: number
  courseIndex: number
  stats: PlayerStats
  thresholds: Thresholds
  difficulty: Difficulty
  difficultyConfig: DifficultyConfig
  // [day][courseIndex]，7×9，null 表示空闲时段
  courses: (Course | null)[][]
  decisions: DayDecision[]
  currentDecision: DayDecision | null
  activeEvent: GameEvent | null
  history: HistoryEntry[]
  // 当日累计未应用的数值变动
  pendingDeltas: StatsDelta
  // 已触发事件 ID，同局不重复
  usedEventIds: string[]
  showWarning: boolean
  // 累计旷课次数，用于点名概率计算（仅统计有课程时的旷课）
  totalSkipCount: number
}
