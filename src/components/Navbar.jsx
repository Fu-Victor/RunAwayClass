import { NavLink } from 'react-router-dom'

function Navbar() {
  // 自定义链接激活时的样式
  const getActiveStyle = ({ isActive }) => ({
    color: isActive ? '#6bff7aff' : '#333',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? '2px solid #6bff9fff' : 'none'
  })

  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="logo">逃课模拟器
        </h1>
        <ul className="nav-menu">
          <li>
            <NavLink to="/" style={getActiveStyle} end>
              首页
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" style={getActiveStyle}>
              关于
            </NavLink>
          </li>
          <li>
            <NavLink to="/products" style={getActiveStyle}>
              产品
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard" style={getActiveStyle}>
              仪表盘
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile/123" style={getActiveStyle}>
              我的档案
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar