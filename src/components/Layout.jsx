import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

function Layout() {
  const { pathname } = useLocation()
  const isGameRoute = pathname.startsWith('/game')

  return (
    <div className="app">
      {!isGameRoute && <Navbar />}
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
