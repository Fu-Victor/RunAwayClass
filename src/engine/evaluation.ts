import type { Evaluation, GameState, Rating } from './types'

export function evaluate(state: GameState): Evaluation {
  const { stats, decisions, thresholds } = state
  const creditScore = normalizeCredits(stats.credits, thresholds)
  const secondaryAvg = (stats.energy + stats.hunger + stats.entertainment) / 3

  let totalSkips = 0
  let totalCourses = 0
  for (const d of decisions) {
    for (const a of d.courseActions) {
      if (a === 'skip') totalSkips++
      totalCourses++
    }
  }
  const skipRate = totalCourses > 0 ? totalSkips / totalCourses : 0

  const composite =
    creditScore * 0.35 +
    (stats.mood / 100) * 20 +
    (secondaryAvg / 100) * 20 +
    (stats.money / 100) * 5 +
    (stats.roommateFavor / 100) * 10 +
    (1 - skipRate) * 10

  let rating: Rating
  if (composite >= 85) rating = 'S'
  else if (composite >= 70) rating = 'A'
  else if (composite >= 50) rating = 'B'
  else if (composite >= 35) rating = 'C'
  else rating = 'D'

  const { title, comment } = matchTitle(rating, stats, skipRate)
  return { rating, title, comment }
}

function normalizeCredits(credits: number, t: GameState['thresholds']): number {
  if (credits >= t.tutorCredits) return 95
  if (credits >= t.passCredits + 10) return 75
  if (credits >= t.passCredits) return 55
  return 30
}

interface TitleCandidate {
  check: (stats: GameState['stats'], skipRate: number) => boolean
  title: string
  comment: string
}

const TITLE_POOL: Record<Rating, TitleCandidate[]> = {
  S: [
    { check: s => s.credits >= 70 && s.mood >= 70, title: '卷王之王', comment: '学得好心态还稳，同学们怀疑你是 AI。' },
    { check: s => s.money >= 80, title: '商业鬼才', comment: '课没上几节，钱没少挣，你是懂大学生存的。' },
    { check: s => s.roommateFavor >= 80, title: '社交恐怖分子', comment: '人缘好到舍友愿意替你去考试。' },
    { check: () => true, title: '六边形战士', comment: '德智体美劳全面发展（稀有物种）。' },
  ],
  A: [
    { check: s => s.credits >= 60 && s.mood < 50, title: '苦行学霸', comment: '学分到手了，精神状态让舍友担忧。' },
    { check: (s, r) => r > 0.5 && s.credits >= 45, title: '逃课仙人', comment: '你用实力证明：课，真的可以不上。' },
    { check: s => s.money >= 60, title: '金牌替身', comment: '帮别人上的课比给自己上的还多，代课界传奇。' },
    { check: () => true, title: '稳中带皮', comment: '大学生活典范，该学学该玩玩。' },
  ],
  B: [
    { check: s => s.money >= 50, title: '小资学渣', comment: '学习不行，搞钱在行。' },
    { check: s => s.roommateFavor >= 60, title: '人情战士', comment: '靠人际关系撑过了这周。' },
    { check: () => true, title: '凑合过吧', comment: '还能离咋的，日子总得过下去。' },
  ],
  C: [
    { check: s => s.mood >= 50, title: '摆烂の胜利', comment: '心态好就是真的好，学分不重要。' },
    { check: s => s.money >= 40, title: '暴发户学渣', comment: '有钱能使鬼推磨，硬靠钞能力撑过这周。' },
    { check: s => s.roommateFavor >= 50, title: '寄生虫の奇迹', comment: '没有舍友你第一天就退学了。' },
    { check: () => true, title: '侥幸毕业', comment: '学位证打印店 50 块做的，好歹是个证。' },
  ],
  D: [
    { check: () => true, title: '学渣之王', comment: '教务处的退学通知书都印好了，被你手快撕了。' },
  ],
}

function matchTitle(
  rating: Rating,
  stats: GameState['stats'],
  skipRate: number,
): { title: string; comment: string } {
  for (const c of TITLE_POOL[rating]) {
    if (c.check(stats, skipRate)) return { title: c.title, comment: c.comment }
  }
  return { title: '未知生物', comment: '你的大学生涯是一个谜。' }
}

export function evaluateFailure(stats: GameState['stats']): Evaluation {
  if (stats.credits < 10) {
    return { rating: 'D', title: '全面溃败', comment: '学习和生活双双缴械，你可能是来大学旅游的。' }
  }
  return { rating: 'D', title: '高处不胜寒', comment: '学分够了，人没了。记得对自己好一点。' }
}
