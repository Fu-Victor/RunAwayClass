import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <div className="app">
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
