import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

function Layout() {
  return (
    <div className="app">
      <Navbar />
      <main >
        <Outlet /> {/* 子路由会在这里渲染 */}
      </main>
    
    </div>
  )
}

export default Layout