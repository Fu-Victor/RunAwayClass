/**
 * 游戏 UI 辅助 — 数据来源：engine constants + content loader
 * Game.jsx 唯一数据接入点，不做硬编码
 */

import { DEFAULT_THRESHOLDS } from '../engine/constants'
import { feedbackTexts } from '../content/loader'

// ==================== 数值元数据（工厂函数，按难度动态生成阈值标记） ====================

export function getStatMeta(thresholds) {
  const t = thresholds || DEFAULT_THRESHOLDS.normal
  return [
    {
      key: 'credits', label: '学分', icon: '📚', max: 100, tone: 'credit', order: 1,
      thresholds: [
        { value: t.tutorCredits, label: '师', color: '#55c47c' },
        { value: t.warningCredits, label: '警', color: '#ca4b3f' },
      ],
    },
    { key: 'mood', label: '心情', icon: '😊', max: 100, tone: 'mood', order: 2,
      thresholds: [{ value: 60, label: '优', color: '#55c47c' }, { value: 20, label: '危', color: '#ca4b3f' }] },
    { key: 'energy', label: '精力', icon: '⚡', max: 100, tone: 'rest', order: 3,
      thresholds: [{ value: 60, label: '优', color: '#55c47c' }, { value: 25, label: '危', color: '#ca4b3f' }] },
    { key: 'hunger', label: '饱腹', icon: '🍕', max: 100, tone: 'hunger', order: 4,
      thresholds: [{ value: 60, label: '优', color: '#55c47c' }, { value: 25, label: '危', color: '#ca4b3f' }] },
    { key: 'entertainment', label: '娱乐', icon: '🎮', max: 100, tone: 'fun', order: 5,
      thresholds: [{ value: 60, label: '优', color: '#55c47c' }, { value: 25, label: '危', color: '#ca4b3f' }] },
    { key: 'money', label: '金钱', icon: '💰', max: 999, tone: 'money', order: 6, isCurrency: true,
      thresholds: [{ value: 80, label: '富', color: '#f5c84c' }, { value: 25, label: '穷', color: '#ca4b3f' }] },
    { key: 'roommateFavor', label: '舍友', icon: '🤝', max: 100, tone: 'roommate', order: 7,
      thresholds: [{ value: 60, label: '优', color: '#55c47c' }, { value: 25, label: '危', color: '#ca4b3f' }] },
  ]
}

// 静态导出兼容非 GameProvider 场景（如菜单预览）
export const statMeta = getStatMeta(DEFAULT_THRESHOLDS.normal)

export const topBarStats = ['credits', 'mood', 'energy', 'hunger', 'entertainment']
export const sidebarStats = ['credits', 'mood', 'energy', 'hunger', 'entertainment', 'money', 'roommateFavor']

// ==================== 数值区间描述（来自 feedbackTexts.yaml） ====================

const LEVEL_LABELS = ['excellent', 'good', 'warning', 'danger', 'critical']

function parseRange(s) { const [min, max] = s.split('-').map(Number); return { min, max } }

const descMap = (() => {
  const m = {}
  for (const [key, entries] of Object.entries(feedbackTexts)) {
    m[key] = entries.map((e) => ({ ...parseRange(e.range), text: e.text, level: LEVEL_LABELS[e.level] || 'good' }))
  }
  return m
})()

const FALLBACKS = {
  credits: [
    { min: 70, max: 999, text: '学神附体', level: 'excellent' },
    { min: 50, max: 69, text: '学分稳稳当当', level: 'good' },
    { min: 30, max: 49, text: '学分告急', level: 'warning' },
    { min: 10, max: 29, text: '离退学只差一步', level: 'danger' },
    { min: 0, max: 9, text: '教务处已在起草退学通知', level: 'critical' },
  ],
  money: [
    { min: 80, max: 999, text: '钱包鼓鼓', level: 'excellent' },
    { min: 40, max: 79, text: '够花', level: 'good' },
    { min: 15, max: 39, text: '开始省吃俭用', level: 'warning' },
    { min: 3, max: 14, text: '泡面都快吃不起了', level: 'danger' },
    { min: 0, max: 2, text: '身无分文', level: 'critical' },
  ],
  roommateFavor: [
    { min: 80, max: 100, text: '舍友是你异父异母的亲兄弟', level: 'excellent' },
    { min: 50, max: 79, text: '宿舍关系融洽', level: 'good' },
    { min: 20, max: 49, text: '舍友开始对你爱答不理', level: 'warning' },
    { min: 5, max: 19, text: '舍友快把你拉黑了', level: 'danger' },
    { min: 0, max: 4, text: '舍友已经搬去隔壁宿舍了', level: 'critical' },
  ],
}

export function getStatDescription(statKey, value) {
  const entries = descMap[statKey] || FALLBACKS[statKey]
  if (!entries) return '-'
  const m = entries.find((r) => value >= r.min && value <= r.max)
  return m ? m.text : '-'
}

export function getStatLevel(statKey, value) {
  const entries = descMap[statKey] || FALLBACKS[statKey]
  if (!entries) return 'good'
  const m = entries.find((r) => value >= r.min && value <= r.max)
  return m ? m.level : 'good'
}

// ==================== 心理描述 ====================

const mindsetTexts = {
  highMood: ['扶我起来，我还能卷！', '今天状态不错，明天补上昨天的债', '虽然课很多，但心情很好'],
  midMood: ['活着就行，不要求太多', '看了看课表，陷入了沉思', '又是新的一天，又是新的痛苦'],
  lowMood: ['你已经麻了，爱咋咋地', '明天？什么是明天？', '课表在嘲笑你，你在嘲笑人生'],
  highCredit: ['学分在手，天下我有', '学霸的自信，从学分开始', '教务处看了都说好'],
  lowCredit: ['再不上课就要被开除了', '你离退学只有一次点名的距离', '学分告急，赶紧上课'],
}

export function getNightMindset(stats) {
  const texts = []
  if (stats.mood >= 70) texts.push(...mindsetTexts.highMood)
  else if (stats.mood < 30) texts.push(...mindsetTexts.lowMood)
  else texts.push(...mindsetTexts.midMood)
  if (stats.credits >= 60) texts.push(...mindsetTexts.highCredit)
  else if (stats.credits < 30) texts.push(...mindsetTexts.lowCredit)
  return texts[Math.floor(Math.random() * texts.length)]
}

// ==================== 阈值预警 ====================

export function getThresholdAlerts(difficulty) {
  const th = DEFAULT_THRESHOLDS[difficulty] || DEFAULT_THRESHOLDS.normal
  return {
    creditWarning: [`⚠️ 学分低于 ${th.warningCredits}！教务处正在向你发送死亡凝视！`],
    creditTutor: [`🎓 学分达到 ${th.tutorCredits}！"家教"功能已解锁！`],
    energyLow: ['😴 眼皮已经在打架了，建议立刻找地方昏迷'],
    hungerLow: ['🍽️ 肚子咕咕叫得像在开演唱会'],
    entertainmentLow: ['📱 精神生活贫瘠得像撒哈拉沙漠'],
  }
}
