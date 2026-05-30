/**
 * 随机事件系统
 * 后续可替换为后端 API（返回事件池及触发条件）
 */

// === 事件定义 ===
export const eventPool = [
  // 点名危机 - 老师爱点名 + 玩家旷课
  {
    id: 'roll_call_crisis',
    type: 'roll_call_crisis',
    title: '点名危机',
    body: '舍友紧急来电："兄弟！下节课老李要查人，已经数到你那排了！床位先别焊死！"',
    condition: (ctx) => {
      const todayPlan = ctx.todayPlan || {}
      const hasSkipped = Object.values(todayPlan).some((a) => a === 'skip')
      return hasSkipped
    },
    options: [
      {
        label: '飞奔回教室',
        delta: { energy: -10, credit: 2, mood: -1 },
        text: '你像被查寝追着跑，气喘吁吁卡点坐下，老师白了你一眼。',
      },
      {
        label: '让舍友帮忙喊到',
        delta: { roommate: -12, credit: -1 },
        text: '舍友的演技一般，但义气尚可。老师半信半疑地勾上了你的名字。',
      },
      {
        label: '爱咋咋地，不去了',
        delta: { credit: -7, mood: 3, entertainment: 6 },
        text: '自由是自由了，教务系统里你的名字也自由地飘红了。',
      },
    ],
  },
  {
    id: 'roll_call_crisis_2',
    type: 'roll_call_crisis',
    title: '突击查人',
    body: '班群突然炸了："导员带着辅导员巡查组进教学楼了！！收到请回复！!"',
    condition: (ctx) => ctx.todayPlan && Object.values(ctx.todayPlan).some((a) => a === 'skip'),
    options: [
      {
        label: '飞速打车回学校',
        delta: { money: -20, energy: -8, credit: 1 },
        text: '你花了二十块钱从校外飞回来，堪称年度最快折返跑。',
      },
      {
        label: '让兄弟顶一下',
        delta: { roommate: -15, credit: -2 },
        text: '兄弟嘴上说着"最后一次"，还是帮你签了。但脸色不太好看。',
      },
    ],
  },

  // 课堂提问 - 玩家在上课 + 老师随机点名
  {
    id: 'class_quiz',
    type: 'class_quiz',
    title: '课堂突袭提问',
    body: '老师推了推眼镜，露出诡异的微笑："这位同学，你来回答一下刚才讲的内容。"全班目光聚焦于你。',
    condition: (ctx) => {
      const todayPlan = ctx.todayPlan || {}
      return Object.values(todayPlan).some((a) => a === 'attend')
    },
    options: [
      {
        label: '自信作答（管它对不对）',
        delta: { credit: 2, mood: 2, energy: -2 },
        text: '你凭借过人的瞎编能力，成功糊弄了过去。老师居然点了点头。',
      },
      {
        label: '低头装死',
        delta: { credit: -2, mood: -2 },
        text: '你把头埋进课本假装隐身。但课本拿反了，全班笑出声。',
      },
      {
        label: '反问老师一个更难的问题',
        delta: { credit: 1, energy: -3, mood: 4 },
        text: '"老师，您刚才说的第三点，跟昨天讲的矛盾了吧？" ——老师陷入了沉思，你赢得了尊重。',
      },
    ],
  },

  // 社交邀约 - 舍友好感度较高
  {
    id: 'social_invite',
    type: 'social_invite',
    title: '食堂邀约',
    body: '舍友发来微信："下课去食堂整点？今天窗口阿姨手没抖，红烧肉分量贼足！"',
    condition: (ctx) => ctx.stats?.roommate >= 45,
    options: [
      {
        label: '必须去！',
        delta: { fullness: 18, mood: 5, money: -12, roommate: 5 },
        text: '你吃到了热乎的饭，也吃到了转瞬即逝的人间烟火。舍友还帮你多打了半勺。',
      },
      {
        label: '婉拒，我要学习',
        delta: { roommate: -7, credit: 1, mood: -1 },
        text: '你打开课件，关掉社交。学分微微上涨，但宿舍关系微微下跌。',
      },
    ],
  },
  {
    id: 'social_invite_2',
    type: 'social_invite',
    title: '深夜烧烤局',
    body: '舍友敲你床板："睡不着，去校门口撸串？AA，我请第一轮。"',
    condition: (ctx) => ctx.stats?.roommate >= 50,
    options: [
      {
        label: '走起！',
        delta: { fullness: 15, entertainment: 12, mood: 6, money: -20, energy: -10, roommate: 8 },
        text: '凌晨一点，你们在烧烤摊上讨论人生、游戏、和明天早八的课怎么逃。',
      },
      {
        label: '太晚了，睡觉',
        delta: { energy: 5, roommate: -4 },
        text: '你翻了个身继续睡。舍友嘟囔了一句"没劲"独自出门。',
      },
    ],
  },

  // 老师私信 - 随机触发
  {
    id: 'teacher_message',
    type: 'teacher_message',
    title: '老师私信',
    body: '某老师发来微信："同学，你上次的作业我看了……格式倒是挺齐，就是内容跟我讲的不太像是一个课的。"',
    condition: () => true,
    options: [
      {
        label: '立马补交一份',
        delta: { energy: -10, credit: 2, mood: -2 },
        text: '你连夜赶了一份，第二天颤颤巍巍发过去。老师回了个👍。',
      },
      {
        label: '诚恳认错，求放过',
        delta: { credit: -1, mood: -1 },
        text: '"老师我错了，下次一定认真写。"——老师没回，但也没再追究。',
      },
      {
        label: '装没看见',
        delta: { credit: -4, mood: 0 },
        text: '你选择性失明了。三天后，成绩系统里多了一条扣分记录。',
      },
    ],
  },

  // 天降横财 - 随机低概率
  {
    id: 'windfall',
    type: 'windfall',
    title: '天降横财',
    body: '你走在校园路上，脚下突然踢到一个东西——是一张皱巴巴的 ¥50 钞票！周围无人注意。',
    condition: () => true,
    weight: 0.3, // 30% 权重（低概率）
    options: [
      {
        label: '揣兜里，今晚加鸡腿',
        delta: { money: 50, mood: 4 },
        text: '你不动声色地捡起来塞进口袋。今天的运气，值得一个豪华版食堂套餐。',
      },
      {
        label: '交给失物招领处',
        delta: { mood: 1, entertainment: -1 },
        text: '你交到了失物招领。阿姨说了声谢谢。你的良心很安稳，你的晚饭很朴素。',
      },
    ],
  },

  // 突击测验
  {
    id: 'pop_quiz',
    type: 'pop_quiz',
    title: '突击测验预警',
    body: '据可靠消息，下节课有突击测验！！范围是"学过的所有内容"（约等于整本教材）。',
    condition: (ctx) => {
      const todayPlan = ctx.todayPlan || {}
      const allSkip = Object.values(todayPlan).every((a) => a === 'skip')
      return allSkip
    },
    options: [
      {
        label: '借舍友笔记狂补',
        delta: { energy: -12, credit: 3, roommate: -3 },
        text: '你用三十分钟狂翻舍友笔记，勉强记住了几个公式。测验时至少没交白卷。',
      },
      {
        label: '相信自己，裸考上阵',
        delta: { credit: -5, mood: -3 },
        text: '你交了一张只写了名字的卷子。老师收卷时的眼神，你终生难忘。',
      },
    ],
  },

  // 快递到了
  {
    id: 'package_arrived',
    type: 'random',
    title: '快递到了',
    body: '菜鸟驿站发来短信："您有 3 个包裹已滞留超过 72 小时，再不来拿就要退回了！"',
    condition: () => true,
    options: [
      {
        label: '翘课去拿快递',
        delta: { entertainment: 8, mood: 5, credit: -2, energy: -3 },
        text: '你拆开了三个快递，里面是零食、新鞋、和一件永远也不会穿的衣服。快乐。',
      },
      {
        label: '下课再说',
        delta: { mood: -1 },
        text: '你决定等下课。但驿站晚上七点就关门了。明天再说吧。',
      },
    ],
  },

  // 校园偶遇
  {
    id: 'campus_encounter',
    type: 'random',
    title: '校园奇遇',
    body: '你在教学楼走廊上迎面遇到了导员。导员冲你笑了笑："最近状态怎么样啊？"',
    condition: () => true,
    options: [
      {
        label: '热情寒暄，刷个好感',
        delta: { mood: 3, energy: -1 },
        text: '"导员好！最近学习状态特别好！"——你说谎时脸不红心不跳，已经修炼成精。',
      },
      {
        label: '点点头，迅速路过',
        delta: {},
        text: '你礼貌而高效地完成了这次社交。导员也没多想，各奔东西。',
      },
    ],
  },

  // 图书馆占座风波
  {
    id: 'library_seat',
    type: 'random',
    title: '占座风波',
    body: '你发现有人用一本书占了图书馆最后一个靠窗座位。但那本书的主人已经消失了一个小时。',
    condition: () => true,
    options: [
      {
        label: '把书挪开，自己坐下',
        delta: { credit: 2, energy: -4, mood: 1 },
        text: '你坐在了靠窗的位置。后来那人回来了，瞪了你一眼，但没敢说什么。',
      },
      {
        label: '算了，回宿舍学',
        delta: { energy: -2, entertainment: 4 },
        text: '你回到宿舍，打开课本。十分钟后，你已经躺在床上刷手机了。',
      },
    ],
  },
]

/**
 * 根据当前游戏上下文选择可触发的事件
 * @param {Object} ctx - { stats, todayPlan, day, skipCount, difficulty }
 * @returns {Array} 候选事件列表
 */
export function selectAvailableEvents(ctx) {
  return eventPool.filter((e) => {
    if (!e.condition(ctx)) return false
    return true
  })
}

/**
 * 从候选事件中随机选择一个（考虑权重）
 * @param {Array} events
 * @returns {Object|null}
 */
export function pickRandomEvent(events) {
  if (events.length === 0) return null

  // 按权重扩展
  const weighted = events.flatMap((e) => {
    const w = e.weight ?? 1
    return Array(Math.round(w * 10)).fill(e)
  })

  return weighted[Math.floor(Math.random() * weighted.length)]
}
