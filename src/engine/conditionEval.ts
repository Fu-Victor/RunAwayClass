// 条件表达式求值器 — 供 events.ts 和 evaluation.ts 共用
// 支持: >=, <=, >, <, ==, !=, and, or, 'default'
// ctx 统一为 Record<string, string | number>，纯数字场景传数字值即可

export function parseCondition(expr: string, ctx: Record<string, string | number>): boolean {
  if (expr === 'default') return true
  if (!expr || expr.trim() === '') return false

  const orParts = expr.split(/\s+or\s+/)
  for (const part of orParts) {
    if (evalAnd(part.trim(), ctx)) return true
  }
  return false
}

function evalAnd(expr: string, ctx: Record<string, string | number>): boolean {
  const parts = expr.split(/\s+and\s+/)
  for (const part of parts) {
    if (!evalCompare(part.trim(), ctx)) return false
  }
  return true
}

function evalCompare(expr: string, ctx: Record<string, string | number>): boolean {
  const match = expr.match(/^(\w+)\s*(>=|<=|!=|==|>|<)\s*'?([^']*)'?$/)
  if (!match) {
    console.warn(`[parseCondition] invalid expression: "${expr}"`)
    return false
  }
  const [, key, op, valStr] = match
  const a = ctx[key]
  if (a === undefined) {
    console.warn(`[parseCondition] unknown variable: "${key}" in "${expr}"`)
    return false
  }

  if (typeof a === 'string') {
    switch (op) {
      case '==': return a === valStr
      case '!=': return a !== valStr
      default:
        console.warn(`[parseCondition] operator "${op}" not supported for strings in "${expr}"`)
        return false
    }
  }

  const b = parseFloat(valStr)
  if (isNaN(b)) return false
  switch (op) {
    case '>=': return a >= b
    case '<=': return a <= b
    case '>':  return a > b
    case '<':  return a < b
    case '==': return a === b
    case '!=': return a !== b
    default:   return false
  }
}
