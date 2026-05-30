import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import NotFound from './pages/NotFound'
import Game from './pages/Game'
function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* 首页 - 当路径为 / 时显示 */}
        <Route index element={<Home />} />
        
        {/* 关于页面 */}
        <Route path="about" element={<About />} />
        
        {/* 产品列表页面 */}
      
        {/* 动态路由：产品详情页 */}
        <Route path="products/:productId" element={<ProductDetail />} />
        
        {/* Dashboard 页面，带有嵌套路由 */}
        <Route path="dashboard" element={<Dashboard />}>
          <Route index element={<DashboardOverview />} />
          <Route path="settings" element={<DashboardSettings />} />
        </Route>
        
        {/* 用户档案页面 */}
        <Route path="profile/:userId" element={<Profile />} />
        <Route path="game" element={<Game />} />
        {/* 404 页面 - 匹配所有未定义的路由 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

// Dashboard 的子组件（也可以单独创建文件）
function DashboardOverview() {
  return <h3>仪表盘概览</h3>
}

function DashboardSettings() {
  return <h3>仪表盘设置</h3>
}

export default App