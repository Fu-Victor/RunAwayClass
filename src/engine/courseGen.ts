import type { Course, DifficultyConfig, Teacher, TeacherSpecial, TeacherTrait } from './types'
import { ROLL_CALL_BASE, TIME_SLOTS, TOTAL_DAYS } from './constants'
import { chance, pick, probLabel, shuffle } from './random'

export function generateCourses(config: DifficultyConfig): (Course | null)[][] {
  const courses: (Course | null)[][] = []
  for (let day = 0; day < TOTAL_DAYS; day++) {
    courses.push(generateDayCourses(config))
  }
  return courses
}

function generateDayCourses(config: DifficultyConfig): (Course | null)[] {
  const totalSlots = TIME_SLOTS.length
  // 计算当天有几节课（至少 1 节，至多 9 节）
  const courseCount = Math.max(1, Math.min(totalSlots, Math.round(totalSlots * config.courseDensity)))

  // 随机选出哪些时段有课
  const allIndices = shuffle(TIME_SLOTS.map((_, i) => i))
  const courseIndices = new Set(allIndices.slice(0, courseCount))

  const slots: (Course | null)[] = []
  for (let slot = 0; slot < totalSlots; slot++) {
    if (courseIndices.has(slot)) {
      const type = chance(config.courseSeriousRatio) ? 'serious' : 'easy'
      slots.push({
        id: '',
        name: '',
        type,
        teacher: generateTeacher(),
        timeSlotIndex: slot,
      })
    } else {
      slots.push(null)
    }
  }
  return slots
}

function generateTeacher(): Teacher {
  const trait: TeacherTrait = chance(0.5) ? 'roll_call_lover' : 'roll_call_hater'
  let special: TeacherSpecial = null
  if (chance(0.15)) {
    special = pick(['quiz_master', 'scripture_master', 'handwriting_only'] as const)
  }
  return { name: '', trait, special }
}

export function calcRollCallProb(
  course: Course,
  skipHistoryCount: number,
  config: DifficultyConfig,
): number {
  let prob = course.teacher.trait === 'roll_call_lover'
    ? ROLL_CALL_BASE.teacherLover
    : ROLL_CALL_BASE.teacherHater

  if (course.type === 'serious') prob += ROLL_CALL_BASE.courseSeriousBonus
  if (course.timeSlotIndex === 0) prob += ROLL_CALL_BASE.earlyMorningBonus
  prob += skipHistoryCount * ROLL_CALL_BASE.skipHistoryBonus
  prob += config.rollCallBias

  return Math.max(0, Math.min(1, prob))
}

// 实时获取某门课的估算点名概率标签
export function getEstimatedProbLabel(
  course: Course,
  skipHistoryCount: number,
  config: DifficultyConfig,
): 'low' | 'medium' | 'high' | 'very_high' {
  return probLabel(calcRollCallProb(course, skipHistoryCount, config))
}

export function checkRollCall(prob: number): boolean {
  return chance(prob)
}

export function finalizeCourses(
  courses: (Course | null)[][],
  courseNames: readonly string[],
  teacherNames: Record<TeacherTrait, readonly string[]>,
): void {
  for (const dayCourses of courses) {
    for (const course of dayCourses) {
      if (course === null) continue
      course.name = pick(courseNames)
      course.teacher.name = pick(teacherNames[course.teacher.trait])
      course.id = `d${course.timeSlotIndex}-${course.name.slice(0, 4)}`
    }
  }
}
