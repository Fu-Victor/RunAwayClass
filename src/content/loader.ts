import { load } from 'js-yaml'
import type { ActionTexts, SettlementTexts, EvaluationTexts } from './types'

// Vite 的 ?raw 后缀将文件内容作为字符串导入
import actionRaw from './actionTexts.yaml?raw'
import settlementRaw from './settlementTexts.yaml?raw'
import evaluationRaw from './evaluationTexts.yaml?raw'

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
