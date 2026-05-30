/**
 * 数值元数据配置
 */

export const statMeta = [
  {
    key: 'credit', label: '学分', icon: '📚', max: 100, tone: 'credit', order: 1,
    description: '核心目标值，上课/帮人代课等获取。太低会被退学。',
    thresholds: [
      { value: 70, label: '优', color: '#55c47c' },
      { value: 35, label: '危', color: '#ca4b3f' },
    ],
  },
  {
    key: 'mood', label: '心情', icon: '😊', max: 100, tone: 'mood', order: 2,
    description: '核心存活值，归零即失败。保持好心情才能高效学习。',
    thresholds: [
      { value: 70, label: '优', color: '#55c47c' },
      { value: 25, label: '危', color: '#ca4b3f' },
    ],
  },
  {
    key: 'energy', label: '精力', icon: '⚡', max: 100, tone: 'rest', order: 3,
    description: '代表疲劳度，低精力增加上课睡着概率。',
    thresholds: [
      { value: 70, label: '优', color: '#55c47c' },
      { value: 30, label: '危', color: '#ca4b3f' },
    ],
  },
  {
    key: 'fullness', label: '饱腹', icon: '🍕', max: 100, tone: 'hunger', order: 4,
    description: '代表饥饿度，低饱腹会持续扣心情。',
    thresholds: [
      { value: 70, label: '优', color: '#55c47c' },
      { value: 30, label: '危', color: '#ca4b3f' },
    ],
  },
  {
    key: 'entertainment', label: '娱乐', icon: '🎮', max: 100, tone: 'fun', order: 5,
    description: '代表精神满足度，低娱乐影响上课效率。',
    thresholds: [
      { value: 70, label: '优', color: '#55c47c' },
      { value: 30, label: '危', color: '#ca4b3f' },
    ],
  },
  {
    key: 'money', label: '金钱', icon: '💰', max: 999, tone: 'money', order: 6,
    description: '用于购买道具等。没钱寸步难行。', isCurrency: true,
    thresholds: [
      { value: 150, label: '富', color: '#f5c84c' },
      { value: 45, label: '穷', color: '#ca4b3f' },
    ],
  },
  {
    key: 'roommate', label: '舍友好感', icon: '🤝', max: 100, tone: 'roommate', order: 7,
    description: '影响旷课时舍友是否帮你打掩护，以及社交事件的触发。',
    thresholds: [
      { value: 70, label: '优', color: '#55c47c' },
      { value: 30, label: '危', color: '#ca4b3f' },
    ],
  },
]

/** 顶部横条展示的数值（核心+次要） */
export const topBarStats = ['credit', 'mood', 'energy', 'fullness', 'entertainment']

/** 侧边栏状态展示的数值（全部） */
export const sidebarStats = ['credit', 'mood', 'energy', 'fullness', 'entertainment', 'money', 'roommate']
