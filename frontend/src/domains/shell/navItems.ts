import { Compass, Folder, LayoutGrid, Library, Timer, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

/** Order and labels from the Figma side rail. */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/apps', label: 'Apps', icon: LayoutGrid },
  { to: '/projects', label: 'Projects', icon: Folder },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/jobs', label: 'Jobs', icon: Timer },
  { to: '/discover', label: 'Discover', icon: Compass },
]
