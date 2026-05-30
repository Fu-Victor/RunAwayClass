/**
 * 通关评价系统
 * 根据第7天结算时的多维数值综合表现给出评级和称号
 */

// === 评级计算 ===
export function calculateRating(stats, skipRate) {
  const {
    credit = 0,
    mood = 0,
    energy = 0,
    fullness = 0,
    entertainment = 0,
    money = 0,
    roommate = 0,
  } = stats

  // 加权综合分（百分制）
  let score = 0
  score += credit * 0.35                       // 最终学分 35%
  score += mood * 0.2                           // 心情 20%
  score += ((energy + fullness + entertainment) / 3) * 0.2  // 次要数值均值 20%
  score += Math.min(money / 5, 5)               // 金钱 5% (上限5分)
  score += roommate * 0.1                       // 舍友好感 10%
  score += Math.min(Math.max(0, (1 - skipRate)) * 10, 10) // 出勤率 10%

  // 确定评级
  if (score >= 80) return 'S'
  if (score >= 65) return 'A'
  if (score >= 50) return 'B'
  if (score >= 35) return 'C'
  return 'D'
}

// === 称号匹配 ===
const titleDefinitions = [
  // S 级称号
  { rating: 'S', title: '卷王之王', condition: (s) => s.credit >= 85 && s.mood >= 60, desc: '你不仅学得好，心态还稳，同学们怀疑你是 AI。' },
  { rating: 'S', title: '六边形战士', condition: (s) => s.credit >= 75 && s.mood >= 70 && s.energy + s.fullness + s.entertainment > 200, desc: '德智体美劳全面发展的当代好青年，稀有物种。' },
  { rating: 'S', title: '校园传说', condition: () => true, desc: '你的大学生涯堪称传奇，后来的学弟学妹会传颂你的故事。' },

  // A 级称号
  { rating: 'A', title: '卷王之王', condition: (s) => s.credit >= 75 && s.mood >= 50, desc: '你不仅学得好，心态还稳，同学们怀疑你是 AI。' },
  { rating: 'A', title: '苦行學霸', condition: (s) => s.credit >= 70 && s.mood < 45, desc: '学分到手了，但你的精神状态让舍友担忧。' },
  { rating: 'A', title: '商业鬼才', condition: (s) => s.money >= 150, desc: '课是一节没少上，钱是一分没少挣。你是懂大学生存的。' },
  { rating: 'A', title: '社交恐怖分子', condition: (s) => s.roommate >= 85, desc: '你的人缘好到舍友愿意替你去考试。' },
  { rating: 'A', title: '六边形战士', condition: () => true, desc: '各方面均衡发展，大学生活典范。' },

  // B 级称号
  { rating: 'B', title: '逃课仙人', condition: (s) => s.credit >= 60 && s.money >= 100, desc: '你证明了：课，是真的可以不上。但钱一定要挣。' },
  { rating: 'B', title: '金牌替身', condition: (s) => s.money >= 120, desc: '你帮别人上的课比给自己上的还多，代课界的传奇。' },
  { rating: 'B', title: '生存大师', condition: (s) => s.mood >= 60, desc: '心态好就是真的好，学分什么的都是浮云。' },
  { rating: 'B', title: '凑合毕业', condition: () => true, desc: '凑合过吧，还能离咋的。学位证拿到了就行。' },

  // C 级称号
  { rating: 'C', title: '摆烂の胜利', condition: (s) => s.mood >= 55, desc: '心态好就是真的好，学分是什么？不重要。' },
  { rating: 'C', title: '侥幸毕业', condition: () => true, desc: '学位证是打印店 50 块做的，但好歹是个证。' },
  { rating: 'C', title: '暴发户学渣', condition: (s) => s.money >= 120, desc: '有钱能使鬼推磨，你硬是靠钞能力撑过了这周。' },
  { rating: 'C', title: '寄生虫の奇迹', condition: (s) => s.roommate >= 70, desc: '如果没有舍友，你第一天就退学了。' },

  // D 级称号
  { rating: 'D', title: '擦线毕业', condition: () => true, desc: '教务处的退学通知书都印好了，又被你撕了。' },
  { rating: 'D', title: '天选废柴', condition: (s) => s.mood < 30 && s.credit < 50, desc: '你的大学生涯就是一部灾难片，但你居然活到了最后。' },
  { rating: 'D', title: '薛定谔的毕业生', condition: () => true, desc: '你到底是毕业了还是被开除了，这是个哲学问题。' },
]

// === 失败评价（心情归零） ===
const failureTitles = [
  { title: '精神崩坏', condition: () => true, desc: '你的心理防线比纸还薄，建议下学期选修《心态管理》。' },
  { title: '全面溃败', condition: (s) => s.credit < 30, desc: '学习和生活双双缴械，你可能是来大学旅游的。' },
  { title: '高处不胜寒', condition: (s) => s.credit >= 50, desc: '学分够了，人没了。下次记得对自己好一点。' },
  { title: '社会性死亡', condition: (s) => s.roommate < 20, desc: '舍友已经拉黑你了，导员也放弃你了，你退学得很彻底。' },
]

/**
 * 匹配称号
 * @param {string} rating - 评级 S/A/B/C/D
 * @param {Object} stats - 最终数值
 * @param {boolean} isFailed - 是否失败
 * @returns {{ title: string, desc: string }}
 */
export function matchTitle(rating, stats, isFailed = false) {
  if (isFailed) {
    const pool = failureTitles.filter((t) => t.condition(stats))
    return pool[0]
  }

  const pool = titleDefinitions.filter((t) => t.rating === rating && t.condition(stats))
  return pool[0] || titleDefinitions.find((t) => t.rating === rating)
}

// === 评级基调 ===
export const ratingTones = {
  S: '你这一周过得比校长还滋润！',
  A: '稳中带皮，大学生活典范。',
  B: '凑合过吧，还能离咋的。',
  C: '在退学边缘反复横跳，但就是不掉下去。',
  D: '教务处的退学通知书都印好了，又被你撕了。',
}
