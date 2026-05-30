import { NavLink } from 'react-router-dom'

function Navbar() {
  const getActiveStyle = ({ isActive }) => ({
    color: isActive ? '#a75021' : '#333',
    fontWeight: isActive ? 'bold' : 'normal',
    borderBottom: isActive ? '2px solid #a75021' : 'none',
  })

  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="logo">逃课模拟器</h1>
        <ul className="nav-menu">
          <li><NavLink to="/" style={getActiveStyle} end>首页</NavLink></li>
          <li><NavLink to="/game" style={getActiveStyle}>开始游戏</NavLink></li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
