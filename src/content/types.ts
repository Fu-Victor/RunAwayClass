// content 配置的类型定义，供 loader 和消费者使用

export interface ActionTexts {
  attend: {
    moodHigh: string
    moodLow: string
    normal: string
    sleepSuffix: string
    phoneSuffix: string
    rollCallSuffix: string
  }
  skip: {
    rollCall: string
    successPool: string[]
  }
  subForOther: {
    main: string
    rollCallSuffix: string
  }
  hireSub: {
    // 以下三个字段中用 {cost} 表示金钱占位符
    fail: string
    rollCall: string
    safe: string
  }
  dawn: {
    sleepEarly: string
    gaming: string
    cram: string
    goOut: string
    normalRest: string
  }
}

export interface SettlementTexts {
  moodGood: string
  moodBad: string
  moodNormal: string
  creditWarning: string
}

export interface EvaluationTexts {
  titlePool: Record<string, {
    title: string
    comment: string
    // check 条件的序列化描述，仅用于文案编写者理解何时触发
    condition: string
  }[]>
  fallback: {
    title: string
    comment: string
  }
  failureHighCredits: {
    title: string
    comment: string
  }
  failureLowCredits: {
    title: string
    comment: string
  }
}
