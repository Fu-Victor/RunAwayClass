import { useState } from 'react'
import './Game.css'
import {
  useGame, GameProvider, COURSE_ACTIONS, FREE_ACTIONS, DAWN_ACTIONS,
  PHASES, SCREENS, periodGroups, HIRE_COST,
} from '../store/gameStore.jsx'
import { sidebarStats, getStatDescription, getStatLevel, getNightMindset, getThresholdAlerts } from '../utils/gameHelpers.js'

const statPercent = (v, max) => Math.min(100, Math.max(0, (v / max) * 100))

// ==================== 右侧状态栏 ====================
function SideStatus() {
  const { stats, statMeta } = useGame()
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
                  return <span key={t.value} className="threshold-arrow"
                    style={{ left: `${Math.min(98, Math.max(2, tPct))}%`, borderTopColor: t.color }}
                    title={`${t.label}：${meta.isCurrency ? '¥' : ''}${t.value}`} />
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
  const { stats, gameThresholds, difficulty } = useGame()
  const alerts = getThresholdAlerts(difficulty)
  const msgs = []
  if (stats.credits <= gameThresholds.creditWarning && stats.credits > 0) msgs.push(alerts.creditWarning[0])
  if (stats.credits >= gameThresholds.creditTutor) msgs.push(alerts.creditTutor[0])
  if (stats.energy < 25) msgs.push(alerts.energyLow[0])
  if (stats.hunger < 25) msgs.push(alerts.hungerLow[0])
  if (msgs.length === 0) return null
  return <div className="threshold-alerts">{msgs.slice(0, 2).map((a, i) => <p key={i}>{a}</p>)}</div>
}

// ==================== 左侧手机 ====================
function PhoneFrame() {
  const { phoneTab, setPhoneTab, todayCourses, coursesWithEstimate, currentCourse, phase, day,
    stats, coursePlan, setCoursePlan, dawnAction, setDawnAction, submitNight, difficultyConfig: dc, gameThresholds,
    eventMessage, phoneMessages,
  } = useGame()
  const [selectedCourseId, setSelectedCourseId] = useState(null)
  const [openedMessage, setOpenedMessage] = useState(null)
  const [readMessages, setReadMessages] = useState(new Set())
  const canEdit = phase === PHASES.NIGHT

  const grouped = periodGroups.map((g) => ({
    ...g,
    courses: g.slots.map((slotIdx) => {
      const c = coursesWithEstimate.find((c) => c.slot === slotIdx) || todayCourses[slotIdx]
      return c || { id: `empty-${slotIdx}`, name: '休息', teacher: '-', type: '水课', isFree: true, time: '', slot: slotIdx }
    }),
  }))
  const allCourses = grouped.flatMap((g) => g.courses)
  const selectedCourse = allCourses.find((c) => c.id === selectedCourseId)

  const hireCount = Object.values(coursePlan).filter((v) => v === 'hire_sub').length
  const totalHireCost = hireCount * HIRE_COST

  const applyDecision = (actionKey) => {
    if (!canEdit || !selectedCourseId) return
    if (actionKey === 'hire_sub' && coursePlan[selectedCourseId] !== 'hire_sub' && totalHireCost + HIRE_COST > stats.money) return
    if (actionKey === 'tutor' && stats.credits < gameThresholds.creditTutor) return
    setCoursePlan(selectedCourseId, actionKey)
  }

  return (
    <aside className="phone-frame" aria-label="模拟手机">
      <div className="phone-speaker" />
      <div className="phone-status"><span>9:41</span><span>5G 78%</span></div>
      {eventMessage && (
        <div className="phone-banner">
          <span className="banner-avatar">{eventMessage.from.slice(0, 1)}</span>
          <span><strong>{eventMessage.from}</strong><small>{eventMessage.text}</small></span>
        </div>
      )}
      {phoneTab === 'home' && (
        <div className="phone-home">
          <button onClick={() => setPhoneTab('messages')} className="app-icon chat-app">
            <span />微信{eventMessage && <b className="app-badge" />}
          </button>
          <button onClick={() => setPhoneTab('schedule')} className="app-icon schedule-app"><span />课表</button>
        </div>
      )}
      {phoneTab === 'messages' && !openedMessage && (() => {
        const msgs = phoneMessages.length > 0 ? phoneMessages : [{ from: '微信', text: '暂无消息' }]
        return (
          <div className="phone-page">
            <button className="phone-back" onClick={() => setPhoneTab('home')}>‹</button>
            <h2>微信</h2>
            <div className="message-list">
              {msgs.map((msg, idx) => {
                const key = `${msg.from}-${idx}`
                const isUnread = !readMessages.has(key)
                return (
                  <button key={key} className={`message-item ${msg.text?.startsWith('📬') ? 'event-msg' : ''}`}
                    onClick={() => { setReadMessages((p) => new Set([...p, key])); setOpenedMessage(msg) }}>
                    <span className="avatar">{msg.from.slice(0, 1)}</span>
                    <span><strong>{msg.from}</strong><small>{msg.text}</small></span>
                    {isUnread && <i />}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })()}
      {phoneTab === 'messages' && openedMessage && (
        <div className="phone-page">
          <button className="phone-back" onClick={() => setOpenedMessage(null)}>‹</button>
          <h2>{openedMessage.from}</h2>
          <div className="chat-detail">
            <div className="chat-bubble">
              <span className="avatar chat-avatar">{openedMessage.from.slice(0, 1)}</span>
              <div className="chat-bubble-text"><p>{openedMessage.text}</p><time>刚刚</time></div>
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
                    const decision = coursePlan[course.id] || (course.isFree ? 'rest' : 'attend')
                    const isSelected = selectedCourseId === course.id
                    const actionsForSlot = course.isFree ? FREE_ACTIONS : COURSE_ACTIONS
                    const meta = actionsForSlot.find((d) => d.key === decision)
                    const riskColors = { '低': '#22c55e', '中': '#4a90d9', '高': '#f59e0b', '极高': '#ef4444' }
                    const riskColor = course.isFree ? 'transparent' : (riskColors[course.estimatedRollCall] || '#999')
                    return (
                      <article key={course.id}
                        className={`phone-course-block ${isSelected ? 'selected' : ''} ${canEdit ? 'editable' : ''} ${course.isFree ? 'free-slot' : ''}`}
                        onClick={() => canEdit && setSelectedCourseId((p) => p === course.id ? null : course.id)}>
                        <button className="course-tile" style={{ background: meta?.color || (course.isFree ? '#555' : '#4a6fa5') }}>
                          <span>{course.name}</span><small>{course.teacher}</small>
                          {!course.isFree && <b className="risk-badge" style={{ background: riskColor }}>{course.estimatedRollCall || '中'}</b>}
                        </button>
                        <time>{course.time}</time>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
            <section className="schedule-period-row schedule-night-row">
              <strong>今夜</strong>
              <div className="night-phone-actions">
                {DAWN_ACTIONS.map((a) => (
                  <button key={a.key} disabled={!canEdit} className={dawnAction === a.key ? 'selected' : ''}
                    onClick={() => setDawnAction(a.key)}>{a.label}</button>
                ))}
              </div>
            </section>
            {canEdit && (
              <div className="phone-decision-bar">
                <div className="decision-bar-label">
                  {selectedCourse ? `已选中：${selectedCourse.name}${selectedCourse.isFree ? '（空闲时段）' : ''}` : '点选课程 → 点下方按钮决定'}
                </div>
                <div className="decision-bar-btns">
                  {selectedCourse && !selectedCourse.isFree && COURSE_ACTIONS.map((d) => {
                    const alreadyHire = coursePlan[selectedCourse.id] === 'hire_sub'
                    const overBudget = d.key === 'hire_sub' && !alreadyHire && totalHireCost + HIRE_COST > stats.money
                    const tutorLocked = d.key === 'tutor' && stats.credits < gameThresholds.creditTutor
                    const hirePoor = d.key === 'hire_sub' && stats.money < HIRE_COST
                    const disabled = hirePoor || overBudget || tutorLocked
                    const reason = tutorLocked ? `需学分 ≥ ${gameThresholds.creditTutor} 解锁家教`
                      : overBudget ? `余额不足：还需 ¥${totalHireCost + HIRE_COST - stats.money}`
                      : hirePoor ? `余额不足：代课费 ¥${HIRE_COST}` : ''
                    return (
                      <button key={d.key} disabled={disabled} className="decision-btn"
                        style={{ background: d.color, opacity: disabled ? 0.3 : 1 }}
                        onClick={() => applyDecision(d.key)} title={reason || undefined}>
                        {d.label}{d.key === 'hire_sub' ? ` ¥${HIRE_COST}` : ''}{tutorLocked ? ` ≥${gameThresholds.creditTutor}学分` : ''}
                      </button>
                    )
                  })}
                  {selectedCourse && selectedCourse.isFree && FREE_ACTIONS.map((d) => (
                    <button key={d.key} className="decision-btn" style={{ background: d.color }}
                      onClick={() => applyDecision(d.key)}>{d.label}</button>
                  ))}
                  {!selectedCourse && <span style={{ fontSize: '0.8rem', color: '#888', padding: '4px 8px' }}>点击上方课程后选择行为</span>}
                </div>
              </div>
            )}
            <button className="phone-submit-plan" disabled={!canEdit}
              onClick={() => { submitNight(); setPhoneTab('home') }}>
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
  const { history: log, stats, gameThresholds } = useGame()
  const [expanded, setExpanded] = useState(false)
  const buff = stats.credits >= gameThresholds.creditTutor ? '学神光环' : '暂无'
  const debuff = stats.mood < 25 ? '生无可恋' : stats.energy < 25 ? '困成标本' : stats.hunger < 15 ? '胃在抗议' : '暂无'
  const recentLogs = log.slice(0, 5)
  return (
    <footer className="bottom-console">
      <div className="buff-column"><strong>buff</strong><span>{buff}</span><strong>debuff</strong><span>{debuff}</span></div>
      <div className={`log-panel ${expanded ? 'log-expanded' : ''}`}
        onClick={() => setExpanded((v) => !v)} title={expanded ? '点击收起' : '点击展开历史'} role="button" tabIndex={0}>
        {expanded
          ? <ul className="log-list">{recentLogs.map((l, i) => <li key={i} className={i === 0 ? 'log-latest' : ''}>{l}</li>)}</ul>
          : <p>{log[0]}</p>}
      </div>
      <div className="history-stack"><button>¥{stats.money}</button><button>舍友 {stats.roommateFavor}</button></div>
    </footer>
  )
}

function NightPhaseCenter() {
  const { stats, setPhoneTab, skipCount } = useGame()
  const mindset = getNightMindset(stats)
  const riskLevel = skipCount < 2 ? '安全' : skipCount < 5 ? '注意' : skipCount < 9 ? '危险' : '高危'
  return (
    <>
      <p className="phase-pill">夜晚决策</p>
      <div className="day-panel night-hint-panel">
        <h2>{mindset}</h2>
        <div className="risk-summary">
          <span className="risk-label">累计旷课 <b>{skipCount}</b> 次</span>
          <span className={`risk-level risk-${riskLevel}`}>点名风险：{riskLevel}</span>
        </div>
        <p>在左侧手机的「课表」中安排明天每节课的行为。课程卡片上的<b>彩色标签</b>显示该节课的估算点名概率。</p>
        <button className="primary-action" onClick={() => setPhoneTab('schedule')}>打开课表安排</button>
      </div>
    </>
  )
}

function DayPhaseCenter() {
  const { currentCourse: course, coursePlan, advanceCourse, nextCourse, skipCount, lastActionResult } = useGame()
  if (lastActionResult) {
    const { courseName, actionKey, description, deltas, triggeredRollCall, triggeredSleep, triggeredPhone, hireSubFailed } = lastActionResult
    const actionLabel = [...COURSE_ACTIONS, ...FREE_ACTIONS].find((a) => a.key === actionKey)?.label || actionKey
    const deltaEntries = deltas ? Object.entries(deltas).filter(([, v]) => v !== 0 && v !== undefined) : []
    const labelMap = { credits: '学分', mood: '心情', energy: '精力', hunger: '饱腹', entertainment: '娱乐', money: '金钱', roommateFavor: '舍友' }
    return (
      <>
        <p className="phase-pill">课程结果</p>
        <div className="day-panel course-result-panel">
          <h2>{courseName}</h2>
          <p className="result-desc">{description}</p>
          {deltaEntries.length > 0 && (
            <div className="delta-list">
              {deltaEntries.map(([key, val]) => (
                <span key={key} className={`delta-item ${val > 0 ? 'delta-up' : 'delta-down'}`}>{labelMap[key] || key} {val > 0 ? '+' : ''}{val}</span>
              ))}
            </div>
          )}
          {triggeredRollCall && actionKey !== 'attend' && <div className="result-alert result-alert-danger">⚠️ 老师点名了！你没在教室，学分扣了。</div>}
          {triggeredRollCall && actionKey === 'attend' && <div className="result-alert result-alert-safe">✅ 老师点名了，你在教室，正常答到。</div>}
          {!triggeredRollCall && actionKey !== 'attend' && actionKey !== 'hire_sub' && <div className="result-alert result-alert-safe">✅ 安全过关，老师没点名！</div>}
          {triggeredSleep && <div className="result-alert result-alert-warn">😴 太困了在课上睡着了。</div>}
          {triggeredPhone && <div className="result-alert result-alert-warn">📱 忍不住刷了手机。</div>}
          {hireSubFailed && <div className="result-alert result-alert-danger">💸 找的代课人也没去！钱白花了还被扣分。</div>}
          <button className="primary-action" onClick={nextCourse}>继续</button>
        </div>
      </>
    )
  }
  if (!course) return <><p className="phase-pill">白天推进</p><div className="day-panel"><h2>无课程安排</h2><button className="primary-action" onClick={advanceCourse}>推进</button></div></>
  const actionKey = coursePlan[course.id] || (course.isFree ? 'rest' : 'attend')
  const actionsForSlot = course.isFree ? FREE_ACTIONS : COURSE_ACTIONS
  const actionMeta = actionsForSlot.find((a) => a.key === actionKey)
  const riskText = course.isFree ? null : `点名风险：${course.estimatedRollCall || '中'} | 累计旷课 ${skipCount} 次`
  return (
    <>
      <p className="phase-pill">白天推进</p>
      <div className="day-panel">
        <div className="student-animation"><span /></div>
        <h2>{course.time} · {course.name}</h2>
        <p>{course.isFree ? '空闲时段' : `${course.teacher} · ${course.type} · ${riskText}`}</p>
        <p>你的安排：<b>{actionMeta?.label || actionKey}</b></p>
        <button className="primary-action" onClick={advanceCourse}>推进这节课</button>
      </div>
    </>
  )
}

function EventPanel() {
  const { currentEvent, resolveEvent } = useGame()
  if (!currentEvent) return null
  return (
    <>
      <p className="phase-pill">突发事件</p>
      <div className="event-card event-center-card">
        <p className="eyebrow">随机事件</p>
        <h2>{currentEvent.title}</h2>
        <p>{currentEvent.description}</p>
        <div className="event-options">
          {currentEvent.options.map((opt, i) => (
            <button key={opt.text} onClick={() => resolveEvent(i)}>{opt.text}</button>
          ))}
        </div>
      </div>
    </>
  )
}

function SettlementPhase() {
  const { stats, day, settleDay, settlementResult, dismissSettlement } = useGame()
  if (settlementResult) {
    return (
      <>
        <p className="phase-pill">每日结算</p>
        <div className="settlement-panel">
          <h2>第 {day - 1} 天结算</h2>
          <p>{settlementResult}</p>
          <div className="result-stats"><p>学分：{stats.credits} | 心情：{stats.mood} | 金钱：¥{stats.money} | 舍友好感：{stats.roommateFavor}</p></div>
          <button className="primary-action" onClick={dismissSettlement}>进入第 {day} 天</button>
        </div>
      </>
    )
  }
  return (
    <>
      <p className="phase-pill">每日结算</p>
      <div className="settlement-panel">
        <h2>第 {day} 天结束</h2>
        <p>{stats.mood < 40 ? '今天有点惨，但至少人还在。' : stats.mood > 70 ? '今天过得不错，你的大学生涯又多活了一天。' : '今天就这样吧。'}</p>
        <button className="primary-action" onClick={settleDay}>进入下一天</button>
      </div>
    </>
  )
}

function ResultScreen() {
  const { result, stats, setScreen } = useGame()
  if (!result) return null
  return (
    <>
      <p className="phase-pill">{result.failed ? '游戏结束' : '通关！'}</p>
      <div className="settlement-panel">
        <h2>{result.failed ? result.title : `评级 ${result.rating}：${result.title}`}</h2>
        <p>{result.desc}</p>
        <div className="result-stats"><p>最终学分：{stats.credits} | 心情：{stats.mood} | 金钱：¥{stats.money} | 舍友好感：{stats.roommateFavor}</p></div>
        <button className="primary-action" onClick={() => setScreen(SCREENS.MENU)}>回到主界面</button>
      </div>
    </>
  )
}

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
  const { startGame, setScreen, difficultyConfig: dc } = useGame()
  const captions = { easy: '水课多，老师慈眉善目，点名少', normal: '标准大学生生存体验，各半', hard: '早八、点名狂魔、作业一起上桌' }
  return (
    <div className="game-shell menu-shell">
      <section className="start-panel difficulty-panel">
        <p className="eyebrow">先选一个生存难度</p>
        <h1>选择难度</h1>
        <div className="difficulty-grid">
          {(['easy', 'normal', 'hard']).map((key) => (
            <button key={key} onClick={() => startGame(key)}>
              <span>{key === 'easy' ? '轻松' : key === 'normal' ? '普通' : '困难'}</span>
              <small>{captions[key]}</small>
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

function GameBoard() {
  const { phase, stats, currentEvent, lastActionResult } = useGame()
  const flashClass = lastActionResult?.triggeredRollCall ? 'roll-call-flash' : ''
  return (
    <div className={`game-shell ${stats.mood < 20 ? 'danger-mood' : ''} ${flashClass}`}>
      <PhoneFrame />
      <main className="control-board no-top-meter">
        <section className="stage">
          <div className="dorm-visual" aria-hidden="true">
            <div className="window-view" /><div className="bed bed-left" /><div className="bed bed-right" /><div className="desk" /><div className="lamp" />
          </div>
          <div className="stage-overlay">
            {phase === PHASES.NIGHT && <NightPhaseCenter />}
            {phase === PHASES.DAY && currentEvent && !lastActionResult && <EventPanel />}
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
  if (screen === SCREENS.HISTORY) return <SimplePanel title="历史记录" lines={history.length ? history : ['暂无历史记录']} onBack={() => setScreen(SCREENS.MENU)} />
  if (screen === SCREENS.TITLES) return <SimplePanel title="称号一览" lines={['卷王之王', '逃课仙人', '摆烂の胜利', '金牌替身', '六边形战士', '商业鬼才', '苦行學霸', '侥幸毕业', '精神崩坏']} onBack={() => setScreen(SCREENS.MENU)} />
  if (screen === SCREENS.CREDITS) return <SimplePanel title="制作人员" lines={['策划：一位仍在赶 ddl 的大学生', 'UI：Figma 宿舍监控台', '开发：React 单机版', '文案：ChatGPT 友情客串']} onBack={() => setScreen(SCREENS.MENU)} />
  return <GameBoard />
}

export default function Game() {
  return <GameProvider><GameInner /></GameProvider>
}
