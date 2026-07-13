import { NavLink } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { cn } from '../lib/utils'

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Accounts', path: '/accounts' },
  { label: 'Transactions', path: '/transactions' },
]

export default function TopNav() {
  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-6 gap-6 shrink-0">
      <span className="font-semibold text-primary tracking-tight mr-4">Kasaio</span>
      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <NavLink
        to="/categories"
        aria-label="Settings"
        className={({ isActive }) =>
          cn(
            'ml-auto rounded-md p-1.5 transition-colors',
            isActive
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
          )
        }
      >
        <Settings className="size-4" />
      </NavLink>
    </header>
  )
}
