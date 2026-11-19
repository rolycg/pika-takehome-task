import { NavLink } from 'react-router'
import { Logo } from '../../shared/ui/Logo'
import { NAV_ITEMS } from './navItems'

export function SideNav() {
  return (
    <nav aria-label="Primary" className="flex w-16 shrink-0 flex-col items-center border-r border-black/5 bg-white py-4">
      <NavLink to="/apps" aria-label="Home" className="mb-6">
        <Logo />
      </NavLink>
      <ul className="flex flex-col items-center gap-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="group relative">
            <NavLink
              to={to}
              aria-label={label}
              className={({ isActive }) =>
                `flex size-10 items-center justify-center rounded-xl transition ${
                  isActive ? 'bg-ink text-white' : 'text-[#5c5c5c] hover:bg-field hover:text-ink'
                }`
              }
            >
              <Icon className="size-[18px]" aria-hidden />
            </NavLink>
            <span
              role="tooltip"
              className="pointer-events-none absolute top-1/2 left-12 z-30 -translate-y-1/2 rounded-md bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-white opacity-0 transition group-hover:opacity-100"
            >
              {label}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-auto size-9 rounded-full bg-gradient-to-br from-[#d97757] to-[#3b2a20]" aria-label="Account" role="img" />
    </nav>
  )
}
