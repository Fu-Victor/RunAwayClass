/**
 * 随机文案池
 * 所有游戏中的搞笑文案均从此处提取
 * 后续可替换为后端 API
 */

// === 数值区间状态描述 ===
export const statDescriptions = {
  mood: {
    ranges: [
      { min: 80, max: 100, text: '心情愉悦，感觉自己是天选之子', level: 'excellent' },
      { min: 50, max: 79, text: '心态平稳，问题不大', level: 'good' },
      { min: 20, max: 49, text: '开始烦躁，想打人', level: 'warning' },
      { min: 5, max: 19, text: 'emo中，生人勿近', level: 'danger' },
      { min: 0, max: 4, text: '已崩溃，建议重开', level: 'critical' },
    ],
  },
  energy: {
    ranges: [
      { min: 80, max: 100, text: '精力旺盛，能徒手解微积分', level: 'excellent' },
      { min: 50, max: 79, text: '状态还行，还能再肝一会儿', level: 'good' },
      { min: 20, max: 49, text: '眼皮已经开始打架了', level: 'warning' },
      { min: 5, max: 19, text: '眼皮已经在打架了，建议立刻找地方昏迷', level: 'danger' },
      { min: 0, max: 4, text: '肉眼可见的灵魂出窍', level: 'critical' },
    ],
  },
  fullness: {
    ranges: [
      { min: 80, max: 100, text: '吃得很饱，战斗力满格', level: 'excellent' },
      { min: 50, max: 79, text: '不饿不撑，刚好能学习', level: 'good' },
      { min: 20, max: 49, text: '肚子开始咕咕叫了', level: 'warning' },
      { min: 5, max: 19, text: '饿到灵魂都在嗷嗷叫', level: 'danger' },
      { min: 0, max: 4, text: '胃已经忘记食物的模样了', level: 'critical' },
    ],
  },
  entertainment: {
    ranges: [
      { min: 80, max: 100, text: '快乐似神仙，学习效率翻倍', level: 'excellent' },
      { min: 50, max: 79, text: '劳逸结合，张弛有度', level: 'good' },
      { min: 20, max: 49, text: '精神粮仓告急，手机刷到没电也没意思', level: 'warning' },
      { min: 5, max: 19, text: '灵魂掉线，需要紧急娱乐充值', level: 'danger' },
      { min: 0, max: 4, text: '生活彻底失去了色彩', level: 'critical' },
    ],
  },
  credit: {
    ranges: [
      { min: 70, max: 100, text: '学神附体，教务处都在夸你', level: 'excellent' },
      { min: 50, max: 69, text: '学分稳稳当当，毕业有望', level: 'good' },
      { min: 30, max: 49, text: '学分告急，教务处的凝视越来越近', level: 'warning' },
      { min: 15, max: 29, text: '离退学只差一步之遥', level: 'danger' },
      { min: 0, max: 14, text: '教务处已经在起草你的退学通知书了', level: 'critical' },
    ],
  },
  roommate: {
    ranges: [
      { min: 80, max: 100, text: '舍友是你异父异母的亲兄弟', level: 'excellent' },
      { min: 50, max: 79, text: '宿舍关系融洽，偶尔还能借个笔记', level: 'good' },
      { min: 20, max: 49, text: '舍友开始对你爱答不理', level: 'warning' },
      { min: 5, max: 19, text: '舍友快把你拉黑了', level: 'danger' },
      { min: 0, max: 4, text: '舍友已经搬去隔壁宿舍了', level: 'critical' },
    ],
  },
}

/**
 * 获取指定数值的区间描述
 */
export function getStatDescription(statKey, value) {
  const config = statDescriptions[statKey]
  if (!config) return '状态未知'
  const range = config.ranges.find((r) => value >= r.min && value <= r.max)
  return range ? range.text : '状态未知'
}

/**
 * 获取数值区间等级
 */
export function getStatLevel(statKey, value) {
  const config = statDescriptions[statKey]
  if (!config) return 'good'
  const range = config.ranges.find((r) => value >= r.min && value <= r.max)
  return range ? range.level : 'good'
}

// === 夜晚决策前的心理描述 ===
export const nightMindsetTexts = {
  highMood: ['扶我起来，我还能卷！', '今天状态不错，明天补上昨天的债', '虽然课很多，但心情很好'],
  midMood: ['活着就行，不要求太多', '看了看课表，陷入了沉思', '又是新的一天，又是新的痛苦'],
  lowMood: ['你已经麻了，爱咋咋地', '明天？什么是明天？', '课表在嘲笑你，你在嘲笑人生'],
  highCredit: ['学分在手，天下我有', '学霸的自信，从学分开始', '教务处看了都说好'],
  lowCredit: ['再不上课就要被开除了', '你离退学只有一次点名的距离', '学分告急，赶紧上课'],
}

/**
 * 根据数值获取心理描述
 */
export function getNightMindset(stats) {
  const texts = []
  if (stats.mood >= 70) texts.push(...nightMindsetTexts.highMood)
  else if (stats.mood < 30) texts.push(...nightMindsetTexts.lowMood)
  else texts.push(...nightMindsetTexts.midMood)

  if (stats.credit >= 60) texts.push(...nightMindsetTexts.highCredit)
  else if (stats.credit < 30) texts.push(...nightMindsetTexts.lowCredit)

  return texts[Math.floor(Math.random() * texts.length)]
}

// === 上课结果描述 ===
export const classResultTexts = {
  attend: [
    '你认真听讲，但灵魂已经飞到了食堂。学分+1。',
    '你坐在前排，被迫和老师进行了全程眼神交流。',
    '你在教室后排找到了最佳摸鱼角度。课听了，但没完全听。',
    '你努力睁开眼睛听课，但PPT上的字越来越模糊……',
  ],
  skip: [
    '你在宿舍的床上度过了一个安详的上午。',
    '你决定这节课不值得你起床。被窝投了赞成票。',
    '你旷了这节课，感觉自己像个自由的人。直到看到班群消息。',
    '你没去上课。你的学分也没来。这是一场公平的交易。',
  ],
  substitute: [
    '你替别人上了一节课，赚到了外快，也失去了半个灵魂。',
    '你坐在别人的座位上，感觉像个卧底。刺激又心虚。',
    '你帮人代课，老师点你的名，你帮别人答"到"。这就是演技。',
  ],
  outsource: [
    '你花钱请人替你上课。这就是资本主义的魔力。',
    '代课的人比你还会演，连老师都信了。钱花得值。',
    '你找了代课，自己躺在床上。这就是大学生存之道。',
  ],
}

/**
 * 获取上课结果文案
 */
export function getClassResultText(actionKey) {
  const pool = classResultTexts[actionKey] || classResultTexts.attend
  return pool[Math.floor(Math.random() * pool.length)]
}

// === 每日结算评语 ===
export const dailySettlementTexts = {
  good: [
    '今天过得不错，你的大学生涯又多活了一天。',
    '今天的你，勉强算是个人才。',
    '学分保住了，心情还行，这已经是难得的胜利。',
  ],
  normal: [
    '今天就这样吧，不算好也不算坏。',
    '你还活着，这就是今天最大的成就。',
    '一天又熬过去了，离毕业还有多久来着？',
  ],
  bad: [
    '今天有点惨，但至少人还在。',
    '你今天的状态，建议直接跳过。',
    '教务处已经在暗中观察你了。',
  ],
}

export function getDailySettlementText(stats) {
  if (stats.mood < 30 || stats.credit < 30) {
    return dailySettlementTexts.bad[Math.floor(Math.random() * dailySettlementTexts.bad.length)]
  }
  if (stats.mood > 60 && stats.credit > 50) {
    return dailySettlementTexts.good[Math.floor(Math.random() * dailySettlementTexts.good.length)]
  }
  return dailySettlementTexts.normal[Math.floor(Math.random() * dailySettlementTexts.normal.length)]
}

// === 数值阈值提示 ===
export const thresholdAlerts = {
  creditWarning: [
    '⚠️ 学分告急！教务处正在向你发送死亡凝视！',
    '⚠️ 你的学分已经低到教务处系统自动报警了！',
    '⚠️ 再这样下去，退学通知书就要打印了！',
  ],
  creditTutor: [
    '🎓 你已经是学神了，开班授课吧！"家教"功能已解锁！',
    '🎓 学分高到可以当老师了！赚外快的新姿势：做家教！',
  ],
  energyLow: [
    '😴 眼皮已经在打架了，建议立刻找地方昏迷',
    '😴 你的精力条比你的未来还暗淡',
  ],
  fullnessLow: [
    '🍽️ 肚子咕咕叫得像在开演唱会',
    '🍽️ 胃已经发出了最后通牒',
  ],
  entertainmentLow: [
    '📱 精神生活贫瘠得像撒哈拉沙漠',
    '📱 你已经三天没刷手机了，手指开始不自主抽搐',
  ],
}
