import { load } from 'js-yaml'
import type { GameEvent } from '../engine/types'
import type { ActionTexts, SettlementTexts, EvaluationTexts, CourseNames, TeacherNames, FeedbackTexts } from './types'

// Vite 的 ?raw 后缀将文件内容作为字符串导入
import actionRaw from './actionTexts.yaml?raw'
import settlementRaw from './settlementTexts.yaml?raw'
import evaluationRaw from './evaluationTexts.yaml?raw'
import courseNamesRaw from './courseNames.yaml?raw'
import teacherNamesRaw from './teacherNames.yaml?raw'
import feedbackRaw from './feedbackTexts.yaml?raw'
import eventRaw from './eventTexts.yaml?raw'

function parse<T>(raw: string, label: string): T {
  try {
    return load(raw) as T
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new Error(`解析 ${label} 失败: ${msg}`)
  }
}

export const actionTexts = parse<ActionTexts>(actionRaw, 'actionTexts.yaml')
export const settlementTexts = parse<SettlementTexts>(settlementRaw, 'settlementTexts.yaml')
export const evaluationTexts = parse<EvaluationTexts>(evaluationRaw, 'evaluationTexts.yaml')
export const courseNames = parse<CourseNames>(courseNamesRaw, 'courseNames.yaml')
export const teacherNames = parse<TeacherNames>(teacherNamesRaw, 'teacherNames.yaml')
export const feedbackTexts = parse<FeedbackTexts>(feedbackRaw, 'feedbackTexts.yaml')
export const eventPool = parse<GameEvent[]>(eventRaw, 'eventTexts.yaml')
