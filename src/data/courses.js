/**
 * 课程与老师数据池
 * 后续可替换为后端 API 调用
 */

// === 课程名称池 ===
export const courseNamePool = [
  '高等数学（睡觉版）',
  '摸鱼学导论',
  'Java 从入门到放弃',
  '食堂菜品鉴赏与实测',
  '中国近现代睡梦史',
  'PPT 玄学排版',
  '宿舍关系危机管理',
  '概率论与玄学抽卡',
  '大学生存指南',
  '外卖配送优化理论',
  '考研政治（催眠方向）',
  '线性代数（矩阵消失术）',
  '英语四级（裸考专训）',
  '体育课（签到即毕业）',
  '形势与政策（水课之王）',
  '计算机基础（开关机实训）',
  '马原（哲学发呆方向）',
  '文献检索与Ctrl+C',
  '实验报告写作艺术',
  '思修（正能量充值）',
  '算法设计与Ctrl+V',
  '期末考试突击方法论',
  '毛概（红色睡眠体验）',
  '大数据概论（什么是大数据）',
  'AI导论（调参玄学）',
  '大学生心理健康（自救指南）',
  '就业指导（画饼实务）',
  '微积分（极限求生版）',
  '物理实验（仪器毁灭者）',
  '毕业论文写作（复制粘贴进阶）',
]

// === 老师名称池 ===
export const teacherNamePool = [
  '李点名',
  '王划水',
  '张挂科',
  '赵念经',
  '周突袭',
  '刘格式',
  '陈辅导',
  '孙欧皇',
  '吴催眠',
  '郑严查',
  '钱放养',
  '马签到',
  '黄突击',
  '林划重点',
  '何挂科',
  '吕签到',
  '施点名',
  '张查人',
  '许念经',
  '苏突袭',
]

// === 老师特殊属性（低概率附加） ===
export const teacherTraits = [
  { id: 'quiz_mania', name: '随机提问狂魔', desc: '上课随时可能提问，胆战心惊', effect: 'quiz_chance_up' },
  { id: 'script_reader', name: '课件念经大师', desc: '照着PPT念一整节课，催眠效果极佳', effect: 'sleep_chance_up' },
  { id: 'sign_maniac', name: '签到只认手写', desc: '必须亲自到场手写签到，代签必死', effect: 'substitute_risk_up' },
  { id: 'homework_freak', name: '作业狂魔', desc: '每节课后必有作业，不交扣分', effect: 'homework_burden' },
  { id: 'easy_grader', name: '水课之王', desc: '上课即放养，考试给原题', effect: 'credit_boost' },
]

// === 课程时段（每天9节：早上3 + 下午3 + 晚上3） ===
export const timeSlots = [
  { label: '08:00-09:30', period: '早上', group: 'morning', earlyBird: true },
  { label: '09:30-11:00', period: '早上', group: 'morning', earlyBird: true },
  { label: '11:00-12:30', period: '早上', group: 'morning', earlyBird: false },
  { label: '14:00-15:30', period: '下午', group: 'afternoon', earlyBird: false },
  { label: '15:30-17:00', period: '下午', group: 'afternoon', earlyBird: false },
  { label: '17:00-18:30', period: '下午', group: 'afternoon', earlyBird: false },
  { label: '19:00-20:10', period: '晚上', group: 'evening', earlyBird: false },
  { label: '20:10-21:20', period: '晚上', group: 'evening', earlyBird: false },
  { label: '21:20-22:30', period: '晚上', group: 'evening', earlyBird: false },
]

/** 时段分组信息 */
export const periodGroups = [
  { key: 'morning', label: '早上', slots: [0, 1, 2], color: '#f5c84c' },
  { key: 'afternoon', label: '下午', slots: [3, 4, 5], color: '#ff9a76' },
  { key: 'evening', label: '晚上', slots: [6, 7, 8], color: '#5a86ff' },
]

/**
 * 为一周生成课程表
 * @param {string} difficulty - 难度：easy/normal/hard
 * @returns {Array} 7天 × 4节的课程数组
 */
export function generateWeekCourses(difficulty = 'normal') {
  const slotsPerDay = timeSlots.length // 9
  const diffConfig = {
    easy: { mainCourseWeight: 0.3, strictTeachers: 0.3 },
    normal: { mainCourseWeight: 0.5, strictTeachers: 0.5 },
    hard: { mainCourseWeight: 0.7, strictTeachers: 0.7 },
  }

  const config = diffConfig[difficulty]
  const courses = []

  const shuffle = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const shuffledNames = shuffle(courseNamePool)
  const shuffledTeachers = shuffle(teacherNamePool)

  for (let day = 1; day <= 7; day++) {
    for (let slot = 0; slot < slotsPerDay; slot++) {
      const isMainCourse = Math.random() < config.mainCourseWeight
      const courseType = isMainCourse ? '正课' : '水课'

      const strictRoll = Math.random() < config.strictTeachers
      const rollCall = strictRoll
        ? ['高', '极高'][Math.floor(Math.random() * 2)]
        : ['低', '中'][Math.floor(Math.random() * 2)]

      const baseCredit = isMainCourse ? 4 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 2)

      const hasTrait = day > 1 && Math.random() < 0.15
      const trait = hasTrait ? teacherTraits[Math.floor(Math.random() * teacherTraits.length)] : null

      courses.push({
        id: `${day}-${slot}`,
        day,
        slot,
        name: shuffledNames[(day * slotsPerDay + slot) % shuffledNames.length],
        teacher: shuffledTeachers[(day * 3 + slot) % shuffledTeachers.length],
        type: courseType,
        rollCall,
        credit: baseCredit,
        time: timeSlots[slot].label,
        period: timeSlots[slot].period,
        group: timeSlots[slot].group,
        trait,
      })
    }
  }

  return courses
}

/**
 * 计算点名概率（估算值，展示给玩家）
 * @returns {'低'|'中'|'高'|'极高'}
 */
export function estimateRollCallProbability(course, skipCount) {
  let score = 0

  // 老师点名倾向
  if (course.rollCall === '极高') score += 40
  else if (course.rollCall === '高') score += 25
  else if (course.rollCall === '中') score += 10
  else score += 0

  // 课程类型
  if (course.type === '正课') score += 10

  // 早上时段（尤其第一节课）
  if (course.earlyBird || course.time?.startsWith('08:')) score += 8

  // 历史旷课
  score += Math.min(skipCount * 3, 20)

  if (score >= 40) return '极高'
  if (score >= 25) return '高'
  if (score >= 12) return '中'
  return '低'
}
