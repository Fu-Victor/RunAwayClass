import type { DawnAction, Difficulty, DifficultyConfig, FreeAction, PlayerStats, Thresholds } from './types'

// 9 节课时段
export const TIME_SLOTS = [
  '8:00-9:40', '9:50-11:30', '11:40-13:20',
  '13:30-15:10', '15:20-17:00', '17:10-18:50',
  '19:00-20:40', '20:50-22:20', '22:30-23:59'
] as const

export const TOTAL_DAYS = 7

export const DEFAULT_THRESHOLDS: Record<Difficulty, Thresholds> = {
  // warningCredits < passCredits，提前预警
  easy:   { passCredits: 30, warningCredits: 20, tutorCredits: 60, crashMood: 0, expectedAvg: 40 },
  normal: { passCredits: 45, warningCredits: 30, tutorCredits: 70, crashMood: 0, expectedAvg: 50 },
  hard:   { passCredits: 60, warningCredits: 40, tutorCredits: 85, crashMood: 0, expectedAvg: 60 },
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    initialStats:      { credits: 10, mood: 80, energy: 80, hunger: 80, entertainment: 80, money: 30, roommateFavor: 60 },
    courseDensity:      0.55,
    courseSeriousRatio: 0.3,
    rollCallBias:       -0.15,
    eventPositiveBias:  0.15,
    rewardMultiplier:   1.3,
  },
  normal: {
    initialStats:      { credits: 5, mood: 65, energy: 65, hunger: 65, entertainment: 65, money: 15, roommateFavor: 40 },
    courseDensity:      0.75,
    courseSeriousRatio: 0.5,
    rollCallBias:       0,
    eventPositiveBias:  0,
    rewardMultiplier:   1.0,
  },
  hard: {
    initialStats:      { credits: 0, mood: 50, energy: 50, hunger: 50, entertainment: 50, money: 5, roommateFavor: 20 },
    courseDensity:      1.0,
    courseSeriousRatio: 0.7,
    rollCallBias:       0.15,
    eventPositiveBias:  -0.15,
    rewardMultiplier:   0.75,
  },
}

// 数值上下限，用于 applyDeltas 时 clamp
export const STAT_MAX: Record<keyof PlayerStats, number> = {
  credits: 999, mood: 100, energy: 100, hunger: 100,
  entertainment: 100, money: 999, roommateFavor: 100,
}

export const STAT_MIN: Record<keyof PlayerStats, number> = {
  credits: 0, mood: 0, energy: 0, hunger: 0,
  entertainment: 0, money: 0, roommateFavor: 0,
}

// 点名概率因子
export const ROLL_CALL_BASE = {
  teacherLover:      0.6,
  teacherHater:      0.15,
  // 正课额外加成
  courseSeriousBonus: 0.1,
  // 早八时段加成
  earlyMorningBonus: 0.1,
  // 每多旷课一次累加
  skipHistoryBonus:  0.05,
} as const

// 老实上课的基础收益（最终受 rewardMultiplier 缩放）
export const ATTEND_EFFECT: PlayerStats = {
  credits: 2, mood: 0, energy: -11, hunger: -8, entertainment: -4, money: 0, roommateFavor: 0,
}

// 旷课的基础收益 — 回血但不给学分
export const SKIP_EFFECT: PlayerStats = {
  credits: 0, mood: 0, energy: 6, hunger: 4, entertainment: 5, money: 0, roommateFavor: 0,
}

// 帮人代课 — 拿钱但消耗更大
export const SUB_FOR_OTHER_EFFECT: PlayerStats = {
  credits: 1, mood: -3, energy: -17, hunger: -8, entertainment: -7, money: 10, roommateFavor: 0,
}

// 找人代课 — 基础效果（风险叠加在 actions.ts 中处理）
export const HIRE_SUB_EFFECT: PlayerStats = {
  credits: 0, mood: 0, energy: 0, hunger: 0, entertainment: 0, money: -35, roommateFavor: 0,
}

export const HIRE_SUB_RISK = 0.20

// 空闲时段行为效果（不受 rewardMultiplier 影响）
export const FREE_SLOT_EFFECTS: Record<FreeAction, PlayerStats> = {
  self_study: { credits: 1, mood: 0, energy: -7,  hunger: -3, entertainment: -5,  money: 0, roommateFavor: 0 },
  rest:       { credits: 0, mood: 0, energy: 10,  hunger: -3, entertainment: -2,  money: 0, roommateFavor: 0 },
  eat:        { credits: 0, mood: 0, energy: 5,   hunger: 10, entertainment: 3,   money: 0, roommateFavor: 0 },
  entertain:  { credits: 0, mood: 0, energy: -3,  hunger: -3, entertainment: 8,   money: 0, roommateFavor: 0 },
}

// go_out 凌晨行为的舍友好感度随机变化参数
export const GO_OUT_ROOMMATE_DELTA = {
  positive: 7,
  negative: -7,
  threshold: 0.5,
} as const

export const DAWN_EFFECTS: Record<DawnAction, PlayerStats> = {
  sleep_early: { credits: 0, mood: 3,  energy: 15,  hunger: -3, entertainment: -5,  money: 0,   roommateFavor: 5 },
  gaming:      { credits: 0, mood: 3,  energy: -28, hunger: -5, entertainment: 13,  money: 0,   roommateFavor: -14 },
  cram:        { credits: 2, mood: -3, energy: -35, hunger: -3, entertainment: -8,  money: 0,   roommateFavor: 0 },
  go_out:      { credits: 0, mood: 5,  energy: -15, hunger: 5,  entertainment: 10,  money: -28, roommateFavor: 0 },
  normal_rest: { credits: 0, mood: 1,  energy: 5,   hunger: -3, entertainment: 0,   money: 0,   roommateFavor: 2 },
}

// 每日自然消耗，在结算时叠加
export const DAILY_DECAY: PlayerStats = {
  credits: 0, mood: 0, energy: -7, hunger: -14, entertainment: -11, money: 0, roommateFavor: 0,
}
