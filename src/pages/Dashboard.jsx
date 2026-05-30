import { Outlet, NavLink } from 'react-router-dom'

function Dashboard() {
  return (
    <div className="page">
      <h2>📊 用户控制台</h2>
      <div className="dashboard-container">
        <div className="dashboard-sidebar">
          <NavLink to="/dashboard" end className={({isActive}) => isActive ? 'active-dashboard-link' : ''}>
            概览
          </NavLink>
          <NavLink to="/dashboard/settings" className={({isActive}) => isActive ? 'active-dashboard-link' : ''}>
            设置
          </NavLink>
        </div>
        <div className="dashboard-content">
          <Outlet /> {/* 嵌套路由内容会显示在这里 */}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
