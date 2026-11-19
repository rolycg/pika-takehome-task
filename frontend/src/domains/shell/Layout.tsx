import { Outlet } from 'react-router'
import { SideNav } from './SideNav'

export function Layout() {
  return (
    <div className="flex h-full min-h-0">
      <SideNav />
      <main className="min-h-0 min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}
