import type { GameEvent } from '../engine/types'

export const EVENT_POOL: GameEvent[] = [
  // ========== 课间事件 ==========
  {
    id: 'roll_call_crisis_1',
    phase: 'course_break',
    condition: "action == 'skip' and trait == 'roll_call_lover'",
    title: '🚨 点名危机！',
    description: '舍友紧急来电："兄弟！！下节课老李要查人！！你人在哪？！"',
    options: [
      { text: '🏃 飞奔回教室', effects: { energy: -10 }, flavorText: '你以百米冲刺速度跑回教室，在老师点到你名字的前一秒推开了门。有惊无险。' },
      { text: '🤷 不管了', effects: { credits: -4, mood: -3 }, flavorText: '你选择了摆烂。老师记下了你的名字，发出意味深长的冷笑。' },
      { text: '📱 叫舍友喊到', effects: { roommateFavor: -8 }, flavorText: '舍友捏着嗓子帮你喊了"到"。你欠舍友一个人情。' }
    ]
  },
  {
    id: 'class_quiz_1',
    phase: 'course_break',
    condition: "action == 'attend' and special == 'quiz_master'",
    title: '📝 突然提问！',
    description: '老师推了推眼镜，目光锁定你："这位同学，你来回答一下。"',
    options: [
      { text: '💪 自信作答', effects: { credits: 2, energy: -3 }, flavorText: '你临场发挥居然蒙对了！老师满意地点点头。' },
      { text: '🙈 低头装死', effects: { credits: -1 }, flavorText: '老师不吃这套。"下课后到我办公室来一趟。"' }
    ]
  },
  {
    id: 'social_invite_1',
    phase: 'course_break',
    condition: 'roommateFavor >= 40',
    title: '🍔 食堂邀约',
    description: '舍友发来微信："下课去食堂整点？今天有红烧肉！"',
    options: [
      { text: '🍖 必须去！', effects: { hunger: 15, mood: 8, money: -8 }, flavorText: '红烧肉真香！和舍友边吃边吐槽老师，心情大好。' },
      { text: '😐 算了下次吧', effects: { roommateFavor: -5 }, flavorText: '舍友回了一个"好吧"的表情包。' }
    ]
  },
  {
    id: 'random_teacher_dm_1',
    phase: 'course_break',
    condition: 'default',
    title: '📬 老师私信',
    description: '某老师发来微信："同学，上次的作业你好像还没交哦？"',
    options: [
      { text: '📝 立马补交', effects: { energy: -10, credits: 1 }, flavorText: '你熬夜肝完了作业。老师回了个"收到"。' },
      { text: '👻 装没看见', effects: { credits: -2, mood: -2 }, flavorText: '你装作没看到，但每次打开微信都心惊胆战。' }
    ]
  },
  {
    id: 'random_windfall_1',
    phase: 'course_break',
    condition: 'default',
    title: '💸 天降横财',
    description: '你在教学楼门口低头一看——地上躺着一张 ¥50！四下无人。',
    options: [
      { text: '🤑 揣兜里', effects: { money: 50, mood: 5 }, flavorText: '横财到手！今天的伙食标准瞬间提高了一个档次。' },
      { text: '😇 交给失物招领', effects: { mood: 3 }, flavorText: '没赚到钱，但内心莫名地平静。' }
    ]
  },
  {
    id: 'surprise_quiz_1',
    phase: 'course_break',
    condition: "courseType == 'serious' and credits < 20",
    title: '📋 突击测验！！',
    description: '据可靠消息，下节课有突击测验！而你几乎没听过课。',
    options: [
      { text: '📖 狂补笔记', effects: { energy: -12, credits: 3 }, flavorText: '你借学霸笔记疯狂抄了一中午。至少没交白卷。' },
      { text: '🎲 相信自己', effects: { credits: -3 }, flavorText: '你自信满满走进考场……发现自己连题目都看不懂。' }
    ]
  },
  // ========== 凌晨事件 ==========
  {
    id: 'roommate_rage_1',
    phase: 'dawn',
    condition: "action == 'gaming' and roommateFavor <= 40",
    title: '😡 舍友暴怒',
    description: '凌晨两点，舍友猛地坐起来："你再敲那个键盘我就把你机箱扔下楼！！"',
    options: [
      { text: '🎧 戴耳机继续', effects: { entertainment: 10, roommateFavor: -15, mood: 2 }, flavorText: '你戴上耳机继续战斗。舍友的怨气已实体化。' },
      { text: '😴 乖乖关机', effects: { roommateFavor: 5, energy: 8 }, flavorText: '你识相地关了电脑。明天再战也不迟。' }
    ]
  },
  {
    id: 'late_emo_1',
    phase: 'dawn',
    condition: "mood <= 35 and action != 'sleep_early'",
    title: '🌙 深夜 emo',
    description: '深夜两点，你突然开始思考人生意义——我为什么要上大学？我是谁？',
    options: [
      { text: '🎵 打开网抑云', effects: { entertainment: -5, mood: -8 }, flavorText: '越听越难受。今晚注定是个不眠之夜。' },
      { text: '🍜 点夜宵', effects: { money: -15, hunger: 10, mood: 5 }, flavorText: '热气腾腾的夜宵下肚，人生还是有意义的。' }
    ]
  },
  {
    id: 'random_midnight_takeout_1',
    phase: 'dawn',
    condition: 'default',
    title: '📱 深夜外卖诱惑',
    description: '满 30 减 15，满 50 减 25——这个力度不点还是人？！',
    options: [
      { text: '🍕 果断下单', effects: { money: -20, hunger: 15, mood: 8 }, flavorText: '深夜碳水，治愈一切。' },
      { text: '😤 忍住省钱', effects: {}, flavorText: '你咬了咬牙关掉 App。省下的钱在心里说了声谢谢。' }
    ]
  },
  {
    id: 'early_bird_1',
    phase: 'dawn',
    condition: "action == 'sleep_early'",
    title: '🌅 早起的感觉',
    description: '清晨六点自然醒，窗外有鸟叫，空气清新，人生充满希望。',
    options: [
      { text: '🏃 去跑步', effects: { energy: 10, mood: 5 }, flavorText: '跑了三圈，感受到了久违的内啡肽。' },
      { text: '🛏️ 再睡会', effects: { energy: 15 }, flavorText: '翻了个身又睡了两小时。确实很爽。' }
    ]
  }
]
