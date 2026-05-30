/**
 * 难度配置
 * 后续可通过 API 动态调整
 */

export const difficultyConfig = {
  easy: {
    label: '简单',
    caption: '水课多，老师慈眉善目',
    initialStats: {
      credit: 48,
      mood: 88,
      energy: 86,
      fullness: 84,
      entertainment: 82,
      money: 120,
      roommate: 74,
    },
    modifiers: {
      creditGain: 1.3,          // 学分获取倍率
      creditLoss: 0.7,          // 学分扣减倍率
      energyDrain: 0.8,         // 精力消耗倍率
      fullnessDrain: 0.8,       // 饱腹消耗倍率
      entertainmentDrain: 0.7,  // 娱乐消耗倍率
      rollCallChance: 0.6,      // 点名概率倍率
      positiveEventWeight: 1.5, // 正面事件权重
      negativeEventWeight: 0.6, // 负面事件权重
      moodThreshold: 70,        // 心情期望值
    },
  },
  normal: {
    label: '普通',
    caption: '标准大学生生存体验',
    initialStats: {
      credit: 40,
      mood: 76,
      energy: 72,
      fullness: 70,
      entertainment: 68,
      money: 80,
      roommate: 62,
    },
    modifiers: {
      creditGain: 1.0,
      creditLoss: 1.0,
      energyDrain: 1.0,
      fullnessDrain: 1.0,
      entertainmentDrain: 1.0,
      rollCallChance: 1.0,
      positiveEventWeight: 1.0,
      negativeEventWeight: 1.0,
      moodThreshold: 60,
    },
  },
  hard: {
    label: '困难',
    caption: '早八、点名、作业一起上桌',
    initialStats: {
      credit: 34,
      mood: 62,
      energy: 58,
      fullness: 60,
      entertainment: 52,
      money: 45,
      roommate: 48,
    },
    modifiers: {
      creditGain: 0.75,
      creditLoss: 1.3,
      energyDrain: 1.2,
      fullnessDrain: 1.15,
      entertainmentDrain: 1.3,
      rollCallChance: 1.4,
      positiveEventWeight: 0.7,
      negativeEventWeight: 1.4,
      moodThreshold: 50,
    },
  },
}

/**
 * 游戏核心阈值配置（所有难度共用）
 */
export const gameThresholds = {
  // 学分阈值
  creditPass: 60,      // 通关值 - 第7天结算时学分 ≥ 此值方可通关
  creditWarning: 35,   // 预警值 - 学分低于此值时触发警告
  creditTutor: 70,     // 家教值 - 学分高于此值时解锁家教功能

  // 心情阈值
  moodCrash: 5,        // 崩溃值 - 心情 ≤ 此值时触发游戏失败

  // 数值衰减（-30%）
  baseEnergyDrain: 6,      // 上课基础精力消耗
  baseFullnessDrain: 4,    // 上课基础饱腹消耗
  baseEntertainmentDrain: 3, // 上课基础娱乐消耗

  // 代课费用
  substituteEarn: 35,    // 帮人代课收入
  outsourceCost: 32,     // 找人代课花费（-30%）
  outsourceFailChance: 0.2, // 找人代课被坑概率
}
