import type { Difficulty, DifficultyConfig, PlayerStats, Thresholds } from './types'

export const DEFAULT_THRESHOLDS: Record<Difficulty, Thresholds> = {
  easy:   { passCredits: 30, warningCredits: 40, tutorCredits: 60, crashMood: 0, expectedAvg: 40 },
  normal: { passCredits: 45, warningCredits: 55, tutorCredits: 70, crashMood: 0, expectedAvg: 50 },
  hard:   { passCredits: 60, warningCredits: 70, tutorCredits: 85, crashMood: 0, expectedAvg: 60 },
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    initialStats:      { credits: 10, mood: 80, energy: 80, hunger: 80, entertainment: 80, money: 30, roommateFavor: 60 },
    courseSeriousRatio: 0.3,
    rollCallBias:       -0.15,
    eventPositiveBias:  0.15,
    expectedAvg:        40,
    rewardMultiplier:   1.3,
  },
  normal: {
    initialStats:      { credits: 5, mood: 65, energy: 65, hunger: 65, entertainment: 65, money: 15, roommateFavor: 40 },
    courseSeriousRatio: 0.5,
    rollCallBias:       0,
    eventPositiveBias:  0,
    expectedAvg:        50,
    rewardMultiplier:   1.0,
  },
  hard: {
    initialStats:      { credits: 0, mood: 50, energy: 50, hunger: 50, entertainment: 50, money: 5, roommateFavor: 20 },
    courseSeriousRatio: 0.7,
    rollCallBias:       0.15,
    eventPositiveBias:  -0.15,
    expectedAvg:        60,
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
  credits: 4, mood: 0, energy: -8, hunger: -6, entertainment: -3, money: 0, roommateFavor: 0,
}

// 旷课的基础收益 — 回血但不给学分
export const SKIP_EFFECT: PlayerStats = {
  credits: 0, mood: 0, energy: 12, hunger: 8, entertainment: 10, money: 0, roommateFavor: 0,
}

// 帮人代课 — 拿钱但消耗更大
export const SUB_FOR_OTHER_EFFECT: PlayerStats = {
  credits: 2, mood: -2, energy: -12, hunger: -6, entertainment: -5, money: 20, roommateFavor: 0,
}

export const HIRE_SUB_COST = 25
// 找人代课反被坑的概率
export const HIRE_SUB_RISK = 0.15

export const DAWN_EFFECTS: Record<string, PlayerStats> = {
  sleep_early: { credits: 0, mood: 5,  energy: 30,  hunger: -3, entertainment: -5,  money: 0,   roommateFavor: 5 },
  gaming:      { credits: 0, mood: 3,  energy: -20, hunger: -5, entertainment: 25,  money: 0,   roommateFavor: -10 },
  cram:        { credits: 3, mood: -3, energy: -25, hunger: -3, entertainment: -8,  money: 0,   roommateFavor: 0 },
  go_out:      { credits: 0, mood: 10, energy: -15, hunger: 5,  entertainment: 20,  money: -20, roommateFavor: 0 },
  normal_rest: { credits: 0, mood: 1,  energy: 10,  hunger: -3, entertainment: 0,   money: 0,   roommateFavor: 2 },
}

// 每日自然消耗，在结算时叠加
export const DAILY_DECAY: PlayerStats = {
  credits: 0, mood: 0, energy: -5, hunger: -10, entertainment: -8, money: 0, roommateFavor: 0,
}
