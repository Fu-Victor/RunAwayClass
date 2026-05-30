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
  // credits 低于此值时触发教务警告
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
  // 正课生成比例 0-1
  courseSeriousRatio: number
  // 点名概率全局偏移 -0.3 ~ +0.3
  rollCallBias: number
  // 正面事件概率偏移
  eventPositiveBias: number
  expectedAvg: number
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
  // 展示给玩家的估算值，实际点名在推进时结算
  estimatedRollCallProb: 'low' | 'medium' | 'high' | 'very_high'
}

export const TIME_SLOTS = [
  '8:00-9:40', '9:50-11:30', '11:40-13:20',
  '13:30-15:10', '15:20-17:00', '17:10-18:50',
  '19:00-20:40', '20:50-22:20', '22:30-23:59'
] as const

export type CourseAction = 'attend' | 'skip' | 'sub_for_other' | 'hire_sub'

export type DawnAction = 'sleep_early' | 'gaming' | 'cram' | 'go_out' | 'normal_rest'

// 每日决策：9节课行为 + 次日凌晨行为
export interface DayDecision {
  courseActions: CourseAction[]
  dawnAction: DawnAction
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
  triggerCondition: string
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
  // [day][courseIndex]，7×9
  courses: Course[][]
  decisions: DayDecision[]
  currentDecision: DayDecision | null
  activeEvent: GameEvent | null
  history: HistoryEntry[]
  // 当日累计未应用的数值变动
  pendingDeltas: StatsDelta
  // 已触发事件 ID，同局不重复
  usedEventIds: Set<string>
  showWarning: boolean
}
