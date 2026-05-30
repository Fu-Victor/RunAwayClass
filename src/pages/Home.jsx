import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="page" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      textAlign: 'center',
      padding: '40px 20px',
    }}>
      <p style={{ color: '#7d5b45', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
        大学生活监控中心
      </p>
      <h1 style={{ fontSize: '48px', fontWeight: 800, margin: '0 0 12px', color: '#24160f' }}>
        逃课模拟器
      </h1>
      <p style={{ color: '#7d5b45', fontSize: '18px', margin: '0 0 40px', maxWidth: '500px', lineHeight: 1.7 }}>
        一款文字决策+肉鸽策略的网页游戏。活过7天，做出选择，看看你能以什么称号毕业。
      </p>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Link to="/game" className="btn btn-primary" style={{
          padding: '14px 32px',
          fontSize: '18px',
          fontWeight: 700,
          textDecoration: 'none',
          borderRadius: '12px',
          background: '#a75021',
          color: '#fff',
          border: 'none',
        }}>
          开始游戏
        </Link>
      </div>
    </div>
  )
}

export default Home
