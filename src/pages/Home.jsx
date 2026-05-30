import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="page">
        <h2>我也不知道要说什么</h2>
      <div className="feature-links">
        <Link to="/products" className="feature-link">
          查看所有产品 →
        </Link>
        <Link to="/about" className="feature-link">
          了解更多 →
        </Link>
        <Link to="/dashboard" className="feature-link">
          进入仪表盘 →
        </Link>
        <Link to="/game" className="feature-link">
            进入游戏 →
        </Link>
      </div>
    </div>
  )
}

export default Home