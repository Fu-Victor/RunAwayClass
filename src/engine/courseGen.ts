import type { Course, DifficultyConfig, Teacher, TeacherSpecial, TeacherTrait } from './types'
import { ROLL_CALL_BASE } from './constants'
import { chance, pick, probLabel } from './random'

export function generateCourses(config: DifficultyConfig): Course[][] {
  const courses: Course[][] = []
  for (let day = 0; day < 7; day++) {
    const dayCourses: Course[] = []
    for (let slot = 0; slot < 9; slot++) {
      const type = chance(config.courseSeriousRatio) ? 'serious' : 'easy'
      dayCourses.push({
        id: `d${day}-s${slot}`,
        name: '',
        type,
        teacher: generateTeacher(),
        timeSlotIndex: slot,
        estimatedRollCallProb: 'low',
      })
    }
    courses.push(dayCourses)
  }
  return courses
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

export function checkRollCall(prob: number): boolean {
  return chance(prob)
}

export function finalizeCourses(
  courses: Course[][],
  courseNames: readonly string[],
  teacherNames: Record<TeacherTrait, readonly string[]>,
  skipHistoryCount: number,
  config: DifficultyConfig,
): void {
  for (const dayCourses of courses) {
    for (const course of dayCourses) {
      course.name = pick(courseNames)
      course.teacher.name = pick(teacherNames[course.teacher.trait])
      course.estimatedRollCallProb = probLabel(
        calcRollCallProb(course, skipHistoryCount, config),
      )
    }
  }
}
