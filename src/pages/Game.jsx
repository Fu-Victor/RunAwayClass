import { useState, useEffect } from 'react'
import './Game.css'

function Game() {
  // 状态管理
  const [stats, setStats] = useState({
    credit: 100,      // 学分（主要）
    mood: 100,        // 心情（主要）
    money: 500,       // 金钱（主要）
    rest: 100,        // 休息（次要）- 疲劳- 代表精力
    hunger: 100,      // 饮食（次要）- 饥饿-
    entertainment: 100 // 娱乐（次要）- 没有娱乐活动-
  })

  // 模拟状态变化（示例）
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        rest: Math.max(0, prev.rest - 0.5),
        hunger: Math.max(0, prev.hunger - 0.3),
        entertainment: Math.max(0, prev.entertainment - 0.2)
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // 更新状态的方法
  const updateStat = (statName, value) => {
    setStats(prev => ({
      ...prev,
      [statName]: Math.min(100, Math.max(0, prev[statName] + value))
    }))
  }
  const [Time, setTime] = useState(21600);/*一天的时间，以秒为单位*/ 
  const [day, setDay] = useState(0);/*当前是第几天*/  
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const [abouttime, setAboutTime] = useState(0);/*关于时间的状态，早上中午晚上的变化*/
  const aboutchange=['早晨','中午','下午','晚上','半夜'];
  useEffect(() => {
      
    const timer = setInterval(() => {
        if (Time >= 86400) {
            setTime(0);/*重置时间*/
            setDay((prevDay) => (prevDay + 1) % 7);/*增加一天，循环到周日后重置为周一*/
        } /*一天的时间到了，重置时间并增加一天*/
        if (Time >= 0 && Time < 21600) {
            
            setAboutTime(4);/*半夜*/
        }
        if (Time >= 21600 && Time < 43200) {
            setAboutTime(0);/*早晨*/
        }
        if (Time >= 43200 && Time < 50400) {
            setAboutTime(1);/*中午*/
        }
        if (Time >= 50400 && Time < 64800) {
            setAboutTime(2);/*下午*/
        }
        if (Time >= 64800 && Time < 86400) {
            setAboutTime(3);/*晚上*/
        }

      setTime((prevTime) => prevTime + 60);
    }, 10);

    return () => clearInterval(timer);
  })
  return (
    <div>
      {/* 状态栏 */}
      <div className="status-bar">
        <h3 className="status-title">状态栏</h3>
        
        {/* 主要状态 */}
        <div className="stats-primary">
          <div className="stat-item">
            <div className="stat-label">
              <span className="stat-icon">📚</span>
              <span>学分</span>
              <span className="stat-value">{Math.floor(stats.credit)}</span>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar credit-bar" style={{width: `${stats.credit}%`}}>
                <div className="stat-bar-glow"></div>
              </div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-label">
              <span className="stat-icon">😊</span>
              <span>心情</span>
              <span className="stat-value">{Math.floor(stats.mood)}</span>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar mood-bar" style={{width: `${stats.mood}%`}}>
                <div className="stat-bar-glow"></div>
              </div>
            </div>
          </div>

          <div className="stat-item">
            <div className="stat-label">
              <span className="stat-icon">💰</span>
              <span>金钱</span>
              <span className="stat-value">{Math.floor(stats.money)}</span>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar money-bar" style={{width: `${stats.money / 10}%`}}>
                <div className="stat-bar-glow"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 分隔线 */}
        <div className="stat-divider"></div>

        {/* 次要状态 */}
        <div className="stats-secondary">
          <div className="stat-item">
            <div className="stat-label">
              <span className="stat-icon">😴</span>
              <span>休息</span>
              <span className="stat-value">{Math.floor(stats.rest)}</span>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar rest-bar" style={{width: `${stats.rest}%`}}>
                <div className="stat-bar-glow"></div>
              </div>
            </div>
          
          </div>

          <div className="stat-item">
            <div className="stat-label">
              <span className="stat-icon">🍕</span>
              <span>饮食</span>
              <span className="stat-value">{Math.floor(stats.hunger)}</span>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar hunger-bar" style={{width: `${stats.hunger}%`}}>
                <div className="stat-bar-glow"></div>
              </div>
            </div>
           
          </div>

          <div className="stat-item">
            <div className="stat-label">
              <span className="stat-icon">🎮</span>
              <span>娱乐</span>
              <span className="stat-value">{Math.floor(stats.entertainment)}</span>
            </div>
            <div className="stat-bar-container">
              <div className="stat-bar entertainment-bar" style={{width: `${stats.entertainment}%`}}>
                <div className="stat-bar-glow"></div>
              </div>
            </div>
           
          </div>
        </div>

        {/* 操作按钮（示例） */}
        <div className="status-actions">
          <button onClick={() => updateStat('rest', 10)} className="action-btn">休息</button>
          <button onClick={() => updateStat('hunger', 15)} className="action-btn">进食</button>
          <button onClick={() => updateStat('entertainment', 12)} className="action-btn">娱乐</button>
        </div>
      </div>

      
      <div className="status-bar" style={{top: "53vh"}}>
        <h2>现在是：{weekDays[day]}的{aboutchange[abouttime]}</h2>
        <h2>当前时间: {Math.floor(Time / 3600)}:{Math.floor((Time % 3600) / 60).toString().padStart(2, '0')}:{(Time % 60).toString().padStart(2, '0')}</h2>
      </div>
      <div className="status-bar" style={{top: "80vh",width: "98vw",height: "15vh"}}>
        这是聊天区域，玩家可以在这里与NPC对话，接受任务，查看日志等。设计为一个简洁的界面，方便玩家快速获取信息和进行交互。
      </div>
      <div >
        <h2>游戏主区域</h2>
        <p>点击按钮管理您的状态</p>
        
      </div>
    </div>
  )
}

export default Game