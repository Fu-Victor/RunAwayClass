import { useState } from 'react'
import './Game.css'
import {
  useGame,
  GameProvider,
  NIGHT_ACTIONS,
  gameThresholds,
  difficultyConfig,
  PHASES,
  SCREENS,
} from '../store/gameStore.jsx'
import { statMeta, sidebarStats } from '../data/statMeta.js'
import { getStatDescription, getStatLevel, getNightMindset, getClassResultText, thresholdAlerts, getDailySettlementText } from '../data/textPools.js'
import { periodGroups } from '../data/courses.js'

// ==================== 静态数据 ====================
const messages = [
  { from: '舍友群聊', text: '兄弟，下节课老师可能查人，床位先别焊死。', unread: true },
  { from: '班级通知', text: '明早 8 点有课，请同学们带上身体和灵魂。', unread: true },
  { from: '老师私信', text: '你上次作业的存在感，比我的发际线还稀薄。', unread: false },
]

const statPercent = (value, max) => Math.min(100, Math.max(0, (value / max) * 100))

// ==================== 右侧状态栏 ====================
function SideStatus() {
  const { stats } = useGame()
  return (
    <aside className="side-status">
      <h2>状态栏</h2>
      <div className="status-list">
        {sidebarStats.map((key) => {
          const meta = statMeta.find((m) => m.key === key)
          if (!meta) return null
          const value = stats[key] || 0
          const pct = statPercent(value, meta.max)
          const desc = getStatDescription(key, value)
          const level = getStatLevel(key, value)
          return (
            <div key={key} className={`status-item ${level}`}>
              <span>{meta.label}</span>
              <strong>{meta.isCurrency ? `¥${value}` : value}</strong>
              <div className="status-bar-wrap">
                <i className="status-bar-fill" style={{ width: `${pct}%` }} />
                {meta.thresholds?.map((t) => {
                  const tPct = (t.value / meta.max) * 100
                  return (
                    <span
                      key={t.value}
                      className="threshold-arrow"
                      style={{ left: `${Math.min(98, Math.max(2, tPct))}%`, borderTopColor: t.color }}
                      title={`${t.label}：${meta.isCurrency ? '¥' : ''}${t.value}`}
                    />
                  )
                })}
              </div>
              <small>{desc}</small>
            </div>
          )
        })}
      </div>
      <ThresholdAlerts />
    </aside>
  )
}

function ThresholdAlerts() {
  const { stats } = useGame()
  const alerts = []
  if (stats.credit <= gameThresholds.creditWarning && stats.credit > 0) alerts.push(thresholdAlerts.creditWarning[0])
  if (stats.credit >= gameThresholds.creditTutor) alerts.push(thresholdAlerts.creditTutor[0])
  if (stats.energy < 25) alerts.push(thresholdAlerts.energyLow[0])
  if (stats.fullness < 25) alerts.push(thresholdAlerts.fullnessLow[0])
  if (alerts.length === 0) return null
  return <div className="threshold-alerts">{alerts.slice(0, 2).map((a, i) => <p key={i}>{a}</p>)}</div>
}

// ==================== 左侧手机 ====================
const decisionMeta = [
  { key: 'attend', label: '上课', color: '#79b8f5' },
  { key: 'fun', label: '娱乐', color: '#ffd772' },
  { key: 'sleep', label: '睡觉', color: '#9b61f5' },
  { key: 'meal', label: '吃饭', color: '#ff9f67' },
  { key: 'substitute', label: '代课', color: '#61e5e6' },
  { key: 'work', label: '打工', color: '#83d77a' },
  { key: 'tutor', label: '家教', color: '#f06db7' },
]

function PhoneFrame() {
  const {
    phoneTab, setPhoneTab,
    todayCourses, coursesWithEstimate, currentCourse, phase, day,
    stats, coursePlan, setCoursePlan, nightPlan, setNightPlan, submitNight,
  } = useGame()

  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [openedMessage, setOpenedMessage] = useState(null)
  const [readMessages, setReadMessages] = useState(new Set())
  const canEdit = phase === PHASES.NIGHT
  const currentIdx = todayCourses.findIndex((c) => c.id === currentCourse?.id)

  const grouped = periodGroups.map((g) => ({
    ...g,
    courses: g.slots.map((slotIdx) => {
      const c = coursesWithEstimate.find((c) => c.slot === slotIdx) || todayCourses[slotIdx]
      return c || { id: `empty-${slotIdx}`, name: '休息', teacher: '-', type: '水课', rollCall: '低', credit: 0, time: '', slot: slotIdx }
    }),
  }))

  const allCourses = grouped.flatMap((g) => g.courses)

  const handleSelectCourse = (courseId) => {
    if (!canEdit) return
    setSelectedCourseId((prev) => (prev === courseId ? null : courseId))
  }

  const applyDecision = (actionKey) => {
    if (!canEdit || !selectedCourseId) return
    setCoursePlan(selectedCourseId, actionKey)
  }

  const handleSubmit = () => {
    if (!canEdit) return
    submitNight()
    setPhoneTab('home')
  }

  return (
    <aside className="phone-frame" aria-label="模拟手机">
      <div className="phone-speaker" />
      <div className="phone-status"><span>9:41</span><span>5G 78%</span></div>

      {phoneTab === 'home' && (
        <div className="phone-home">
          <button onClick={() => setPhoneTab('messages')} className="app-icon chat-app"><span />微信{messages.some((m) => m.unread && !readMessages.has(m.from)) && <b />}</button>
          <button onClick={() => setPhoneTab('schedule')} className="app-icon schedule-app"><span />课表</button>
        </div>
      )}

      {phoneTab === 'messages' && !openedMessage && (
        <div className="phone-page">
          <button className="phone-back" onClick={() => setPhoneTab('home')}>‹</button>
          <h2>微信</h2>
          <div className="message-list">
            {messages.map((msg) => {
              const isUnread = msg.unread && !readMessages.has(msg.from)
              return (
                <button
                  key={msg.from}
                  className="message-item"
                  onClick={() => {
                    setReadMessages((prev) => new Set([...prev, msg.from]))
                    setOpenedMessage(msg)
                  }}
                >
                  <span className="avatar">{msg.from.slice(0, 1)}</span>
                  <span><strong>{msg.from}</strong><small>{msg.text}</small></span>
                  {isUnread && <i />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phoneTab === 'messages' && openedMessage && (
        <div className="phone-page">
          <button className="phone-back" onClick={() => setOpenedMessage(null)}>‹</button>
          <h2>{openedMessage.from}</h2>
          <div className="chat-detail">
            <div className="chat-bubble">
              <span className="avatar chat-avatar">{openedMessage.from.slice(0, 1)}</span>
              <div className="chat-bubble-text">
                <p>{openedMessage.text}</p>
                <time>刚刚</time>
              </div>
            </div>
          </div>
        </div>
      )}

      {phoneTab === 'schedule' && (
        <div className="phone-page phone-schedule-page">
          <button className="phone-back" onClick={() => setPhoneTab('home')}>‹</button>
          <h2>第 {Math.min(day, 7)} 天 · {canEdit ? '夜晚决策' : '课表'}</h2>

          <div className="phone-schedule-board">
            {grouped.map((group) => (
              <section key={group.key} className="schedule-period-row">
                <strong style={{ color: group.color }}>{group.label}</strong>
                <div className="schedule-course-strip">
                  {group.courses.map((course, idx) => {
                    const realIdx = group.slots[idx]
                    const decision = coursePlan[course.id] || 'attend'
                    const meta = decisionMeta.find((d) => d.key === decision)
                    const isSelected = selectedCourseId === course.id
                    const isNow = phase === PHASES.DAY && currentIdx === realIdx
                    return (
                      <article
                        key={course.id}
                        className={`phone-course-block ${isSelected ? 'selected' : ''} ${isNow ? 'now' : ''} ${canEdit ? 'editable' : ''}`}
                        onClick={() => handleSelectCourse(course.id)}
                      >
                        <button className="course-tile" style={{ background: meta?.color }}>
                          <span>{course.name}</span>
                          <small>{course.teacher}</small>
                          <small>{course.type} · {course.credit}分</small>
                        </button>
                        <time>{course.time}</time>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}

            {/* 夜晚行为 */}
            <section className="schedule-period-row schedule-night-row">
              <strong>今夜</strong>
              <div className="night-phone-actions">
                {NIGHT_ACTIONS.map((a) => (
                  <button
                    key={a.key}
                    disabled={!canEdit}
                    className={nightPlan === a.key ? 'selected' : ''}
                    onClick={() => setNightPlan(a.key)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 底部决策栏 */}
            {canEdit && (
              <div className="phone-decision-bar">
                <div className="decision-bar-label">
                  {selectedCourseId
                    ? `已选中：${allCourses.find((c) => c.id === selectedCourseId)?.name || '—'}`
                    : '点选课程 → 点下方按钮决定'}
                </div>
                <div className="decision-bar-btns">
                  {decisionMeta.map((d) => {
                    const disabled =
                      !selectedCourseId ||
                      (d.key === 'tutor' && stats.credit < gameThresholds.creditTutor)
                    return (
                      <button
                        key={d.key}
                        disabled={disabled}
                        className="decision-btn"
                        style={{ background: d.color }}
                        onClick={() => applyDecision(d.key)}
                      >
                        {d.label}
                        {d.key === 'tutor' && stats.credit < gameThresholds.creditTutor && '🔒'}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <button className="phone-submit-plan" disabled={!canEdit} onClick={handleSubmit}>
              {canEdit ? '确认安排，开摆！' : '白天进行中…'}
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

// ==================== 中央区域 ====================
function BottomConsole() {
  const { history, stats } = useGame()
  const buff = stats.credit >= gameThresholds.creditTutor ? '学神光环' : '暂无'
  const debuff = stats.mood < 25 ? '生无可恋' : stats.energy < 25 ? '困成标本' : stats.fullness < 15 ? '胃在抗议' : '暂无'
  return (
    <footer className="bottom-console">
      <div className="buff-column"><strong>buff</strong><span>{buff}</span><strong>debuff</strong><span>{debuff}</span></div>
      <div className="log-panel"><p>{history[0]}</p></div>
      <div className="history-stack"><button>¥{stats.money}</button><button>舍友 {stats.roommate}</button></div>
    </footer>
  )
}

/** 夜晚：提示用户在手机中做决策 */
function NightPhaseCenter() {
  const { stats, setPhoneTab } = useGame()
  const mindset = getNightMindset(stats)
  return (
    <>
      <p className="phase-pill">夜晚决策</p>
      <div className="day-panel night-hint-panel">
        <h2>{mindset}</h2>
        <p>在左侧手机的「课表」中安排明天每节课的上课/旷课/代课，以及今晚的行为。</p>
        <button className="primary-action" onClick={() => setPhoneTab('schedule')}>打开课表安排</button>
      </div>
    </>
  )
}

/** 白天：推进课程 */
function DayPhaseCenter() {
  const { currentCourse: course, coursePlan, stats, advanceCourse, incrementCounter } = useGame()
  const actionKey = coursePlan[course?.id] || 'attend'
  const labelMap = {
    attend: '上课', fun: '娱乐', sleep: '睡觉', meal: '吃饭',
    substitute: '代课', work: '打工', tutor: '家教',
  }
  const actionLabel = labelMap[actionKey] || '上课'

  const isSkipping = ['fun', 'sleep', 'meal', 'work', 'tutor', 'substitute'].includes(actionKey)

  const handleAdvance = () => {
    const moodBonus = stats.mood >= 80 ? 1 : stats.mood < 35 ? -1 : 0
    const highRisk = ['高', '极高'].includes(course.rollCall) || course.slot === 0
    const caught = highRisk && Math.random() < 0.58
    let delta, text

    if (actionKey === 'attend') {
      delta = {
        credit: course.credit + moodBonus,
        energy: -gameThresholds.baseEnergyDrain,
        fullness: -gameThresholds.baseFullnessDrain,
        entertainment: -gameThresholds.baseEntertainmentDrain,
        mood: course.slot === 0 ? -1 : 1,
      }
      text = getClassResultText('attend')
    } else {
      incrementCounter('skipCount')
      if (caught) {
        // 点名被抓，额外扣学分
        delta = { credit: -6, mood: -2, fullness: -4 }
        if (actionKey === 'fun') {
          delta.entertainment = 10; delta.energy = -4
          text = `你在${course.name}课上玩手机，${course.teacher}把你揪了出来。`
        } else if (actionKey === 'sleep') {
          delta.energy = 8
          text = `你在${course.name}课上睡着了，${course.teacher}叫醒你时全班都在笑。`
        } else if (actionKey === 'meal') {
          delta.fullness = 12; delta.money = -12
          text = `你在食堂吃着饭，班群消息：${course.teacher}点名了。`
        } else if (actionKey === 'work') {
          delta.money = 15; delta.energy = -14
          text = `打工回来发现${course.teacher}点名了，血亏。`
        } else if (actionKey === 'tutor') {
          delta.money = 15; delta.credit = -2; delta.energy = -18
          text = `家教去了，但${course.teacher}点名了，两头不讨好。`
        } else if (actionKey === 'substitute') {
          delta.money = 20; delta.energy = -18
          text = `你帮人代课却错过了自己的课，${course.teacher}记了你一笔。`
        } else {
          delta.credit = -6; delta.mood = -2
          text = `你没去上《${course.name}》，${course.teacher}点名了。`
        }
      } else {
        // 没被抓
        if (actionKey === 'fun') {
          delta = { entertainment: 22, energy: -6, fullness: -5, mood: 6 }
          text = `你在${course.name}时段尽情娱乐，快乐指数飙升！`
        } else if (actionKey === 'sleep') {
          delta = { energy: 22, entertainment: -2, fullness: -4, mood: 3 }
          text = `你美美睡了一觉，精力回满，神清气爽。`
        } else if (actionKey === 'meal') {
          delta = { fullness: 22, energy: -4, entertainment: 4, mood: 5, money: -12 }
          text = `你去食堂大快朵颐，肚子饱了，心情好了。`
        } else if (actionKey === 'work') {
          delta = { money: 30, energy: -22, fullness: -8, entertainment: -4, mood: -2 }
          text = `你用上课时间打工，赚了 ¥30，但疲惫不堪。`
        } else if (actionKey === 'tutor') {
          delta = { money: 25, credit: 2, energy: -20, fullness: -6, mood: -1 }
          text = `你给学弟学妹做家教，赚了 ¥25，还巩固了知识。`
        } else if (actionKey === 'substitute') {
          delta = { money: gameThresholds.substituteEarn, credit: 1, energy: -18, fullness: -8, mood: -1 }
          text = getClassResultText('substitute')
        } else {
          delta = { entertainment: 10, energy: 14, fullness: -4, mood: 3 }
          text = getClassResultText('skip')
        }
      }
    }

    advanceCourse(delta, text, isSkipping || Math.random() < 0.35)
  }

  return (
    <>
      <p className="phase-pill">白天推进</p>
      <div className="day-panel">
        <div className="student-animation"><span /></div>
        <h2>{course?.time} · {course?.name}</h2>
        <p>{course?.teacher} 正在教室里……夜前安排：{actionLabel}</p>
        <button className="primary-action" onClick={handleAdvance}>推进这节课</button>
      </div>
    </>
  )
}

/** 事件弹窗（居中） */
function EventPanel() {
  const { currentEvent, resolveEvent } = useGame()
  if (!currentEvent) return null
  return (
    <>
      <p className="phase-pill">突发事件</p>
      <div className="event-card event-center-card">
        <p className="eyebrow">随机事件</p>
        <h2>{currentEvent.title}</h2>
        <p>{currentEvent.body}</p>
        <div className="event-options">
          {currentEvent.options.map((opt) => (
            <button key={opt.label} onClick={() => resolveEvent(opt.delta, opt.text)}>{opt.label}</button>
          ))}
        </div>
      </div>
    </>
  )
}

/** 每日结算 */
function SettlementPhase() {
  const { stats, day, settleDay } = useGame()
  const dailyText = getDailySettlementText(stats)
  return (
    <>
      <p className="phase-pill">每日结算</p>
      <div className="settlement-panel">
        <h2>第 {day} 天结束</h2>
        <p>{dailyText}</p>
        <button className="primary-action" onClick={settleDay}>进入下一天</button>
      </div>
    </>
  )
}

/** 通关/失败结果 */
function ResultScreen() {
  const { result, stats, setScreen } = useGame()
  if (!result) return null
  return (
    <>
      <p className="phase-pill">{result.failed ? '游戏结束' : '通关！'}</p>
      <div className="settlement-panel">
        <h2>{result.failed ? result.title : `评级 ${result.rating}：${result.title}`}</h2>
        <p>{result.desc}</p>
        <div className="result-stats">
          <p>最终学分：{stats.credit} | 心情：{stats.mood} | 金钱：¥{stats.money} | 舍友好感：{stats.roommate}</p>
        </div>
        <button className="primary-action" onClick={() => setScreen(SCREENS.MENU)}>回到主界面</button>
      </div>
    </>
  )
}

// ==================== 菜单 ====================
function MenuScreen() {
  const { setScreen } = useGame()
  return (
    <div className="game-shell menu-shell">
      <section className="start-panel">
        <p className="eyebrow">大学生活监控中心</p>
        <h1>逃课模拟器</h1>
        <div className="menu-grid">
          <button onClick={() => setScreen(SCREENS.DIFFICULTY)}>开始游戏</button>
          <button onClick={() => setScreen(SCREENS.HISTORY)}>历史记录</button>
          <button onClick={() => setScreen(SCREENS.TITLES)}>称号一览</button>
          <button onClick={() => setScreen(SCREENS.CREDITS)}>制作人员</button>
        </div>
      </section>
    </div>
  )
}

function DifficultyScreen() {
  const { startGame, difficulty, setScreen } = useGame()
  return (
    <div className="game-shell menu-shell">
      <section className="start-panel difficulty-panel">
        <p className="eyebrow">先选一个生存难度</p>
        <h1>选择难度</h1>
        <div className="difficulty-grid">
          {Object.entries(difficultyConfig).map(([key, item]) => (
            <button key={key} className={difficulty === key ? 'selected' : ''} onClick={() => startGame(key)}>
              <span>{item.label}</span>
              <small>{item.caption}</small>
            </button>
          ))}
        </div>
        <button className="ghost-link" onClick={() => setScreen(SCREENS.MENU)}>返回主界面</button>
      </section>
    </div>
  )
}

function SimplePanel({ title, lines, onBack }) {
  return (
    <div className="game-shell menu-shell">
      <section className="start-panel info-panel">
        <h1>{title}</h1>
        {lines.map((line, i) => <p key={i}>{line}</p>)}
        <button className="ghost-link" onClick={onBack}>返回主界面</button>
      </section>
    </div>
  )
}

// ==================== 主游戏画面 ====================
function GameBoard() {
  const { phase, stats, currentEvent } = useGame()
  return (
    <div className={`game-shell ${stats.mood < 20 ? 'danger-mood' : ''}`}>
      <PhoneFrame />
      <main className="control-board no-top-meter">
        <section className="stage">
          <div className="dorm-visual" aria-hidden="true">
            <div className="window-view" />
            <div className="bed bed-left" />
            <div className="bed bed-right" />
            <div className="desk" />
            <div className="lamp" />
          </div>
          <div className="stage-overlay">
            {phase === PHASES.NIGHT && <NightPhaseCenter />}
            {phase === PHASES.DAY && currentEvent && <EventPanel />}
            {phase === PHASES.DAY && !currentEvent && <DayPhaseCenter />}
            {phase === PHASES.SETTLEMENT && <SettlementPhase />}
            {phase === PHASES.RESULT && <ResultScreen />}
          </div>
        </section>
        <BottomConsole />
      </main>
      <SideStatus />
    </div>
  )
}

function GameInner() {
  const { screen, setScreen, history } = useGame()
  if (screen === SCREENS.MENU) return <MenuScreen />
  if (screen === SCREENS.DIFFICULTY) return <DifficultyScreen />
  if (screen === SCREENS.HISTORY) {
    return <SimplePanel title="历史记录" lines={history.length ? history : ['暂无历史记录']} onBack={() => setScreen(SCREENS.MENU)} />
  }
  if (screen === SCREENS.TITLES) {
    return <SimplePanel title="称号一览" lines={['卷王之王', '逃课仙人', '摆烂の胜利', '金牌替身', '六边形战士', '商业鬼才', '苦行學霸', '侥幸毕业', '精神崩坏']} onBack={() => setScreen(SCREENS.MENU)} />
  }
  if (screen === SCREENS.CREDITS) {
    return <SimplePanel title="制作人员" lines={['策划：一位仍在赶 ddl 的大学生', 'UI：Figma 宿舍监控台', '开发：React 单机版', '文案：ChatGPT 友情客串']} onBack={() => setScreen(SCREENS.MENU)} />
  }
  return <GameBoard />
}

export default function Game() {
  return (
    <GameProvider>
      <GameInner />
    </GameProvider>
  )
}
