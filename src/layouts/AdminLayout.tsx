import { type FC, type ReactNode, useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { YaokoLogo } from '@/components/brand/YaokoLogo'
import { useAuth } from '@/lib/auth'
import { ticketsApi, notificationsApi } from '@/lib/api'
import {
  IconDashboard, IconBuilding, IconUsers, IconGift, IconTicket, IconPin,
  IconTablet, IconMonitor, IconMap, IconInbox, IconBell, IconSettings,
  IconSearch, IconPlus, IconLogout, IconLogo, IconShield,
} from '@/components/ui/icons'

type NavItem = {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
  badge?: string
}

const controlNav: NavItem[] = [
  { to: '/admin', label: 'Дашборд', icon: <IconDashboard size={18} />, end: true },
  { to: '/admin/organizations', label: 'Организации', icon: <IconBuilding size={18} /> },
  { to: '/admin/participants', label: 'Участники', icon: <IconUsers size={18} /> },
  { to: '/admin/offers', label: 'Акции', icon: <IconGift size={18} /> },
  { to: '/admin/coupons', label: 'Купоны', icon: <IconTicket size={18} /> },
]

const infraNav: NavItem[] = [
  { to: '/admin/points', label: 'Точки', icon: <IconPin size={18} /> },
  { to: '/admin/tablets', label: 'Планшеты', icon: <IconTablet size={18} /> },
  { to: '/admin/monitors', label: 'Мониторы', icon: <IconMonitor size={18} /> },
]

const getSystemNav = (ticketCount: number, notifCount: number): NavItem[] => [
  { to: '/admin/requests', label: 'Заявки', icon: <IconInbox size={18} />, badge: ticketCount > 0 ? String(ticketCount) : undefined },
  { to: '/admin/notifications', label: 'Уведомления', icon: <IconBell size={18} />, badge: notifCount > 0 ? String(notifCount) : undefined },
  { to: '/admin/settings', label: 'Настройки', icon: <IconSettings size={18} /> },
]

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="section-title px-3 pb-1 pt-2">{title}</div>
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
        >
          <span className="text-loko-text-secondary group-hover:text-loko-text-primary">{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="rounded-full bg-loko-pink/15 px-2 py-0.5 text-[10px] font-semibold text-loko-pink">
              {item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </div>
  )
}

function useBreadcrumb() {
  const loc = useLocation()
  const path = loc.pathname.replace('/admin', '').replace(/^\//, '')
  if (!path) return ['Дашборд']
  const segs = path.split('/')
  const map: Record<string, string> = {
    organizations: 'Организации',
    participants: 'Участники',
    offers: 'Акции',
    coupons: 'Купоны',
    points: 'Точки',
    tablets: 'Планшеты',
    monitors: 'Мониторы',
    geography: 'География',
    requests: 'Заявки',
    notifications: 'Уведомления',
    settings: 'Настройки',
  }
  return [map[segs[0]] ?? 'Дашборд', ...segs.slice(1)]
}

export const AdminLayout: FC = () => {
  const crumbs = useBreadcrumb()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [ticketCount, setTicketCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)
  const systemNav = getSystemNav(ticketCount, notifCount)

  useEffect(() => {
    const fetchCounts = () => {
      ticketsApi.count().then(d => setTicketCount(d.count)).catch(() => {})
      notificationsApi.count().then(d => setNotifCount(d.count)).catch(() => {})
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000) // обновляем каждые 30 сек
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = (user?.name || 'АД').slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen bg-loko-bg-base text-loko-text-primary">
      {/* SIDEBAR */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-loko-bg-border bg-loko-bg-surface/60 px-4 py-5 backdrop-blur-xl lg:flex">
        <Link to="/" className="mb-7 flex items-center gap-3 px-2">
          <IconLogo size={28} />
          <YaokoLogo className="h-10" />
        </Link>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto pb-4">
          <NavGroup title="Контур" items={controlNav} />
          <NavGroup title="Инфраструктура" items={infraNav} />
          <NavGroup title="Система" items={systemNav} />
        </nav>

        {/* Профиль */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-loko-bg-border bg-loko-bg-elevated/50 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-sm font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-loko-text-primary">{user?.name || 'Администратор'}</div>
            <div className="text-xs text-loko-text-muted">{user?.email || 'Администратор'}</div>
          </div>
          <button onClick={handleLogout} className="text-loko-text-muted hover:text-loko-pink" aria-label="Выйти">
            <IconLogout size={18} />
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center gap-2 md:gap-4 border-b border-loko-bg-border bg-loko-bg-base/85 px-4 md:px-6 py-3 md:py-4 backdrop-blur-xl">
          <nav className="hidden sm:flex items-center gap-1 text-sm text-loko-text-secondary">
            <Link to="/admin" className="hover:text-loko-text-primary">Контур</Link>
            <span className="text-loko-text-muted">/</span>
            {crumbs.map((c, i) => (
              <span key={i} className={i === crumbs.length - 1 ? 'text-loko-text-primary' : ''}>{c}</span>
            )).reduce<ReactNode[]>((acc, el, i) => {
              if (i > 0) acc.push(<span key={`sep-${i}`} className="text-loko-text-muted">/</span>)
              acc.push(el)
              return acc
            }, [])}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-loko-bg-border bg-loko-bg-surface/50 px-3 py-2 text-sm text-loko-text-muted md:flex md:w-72">
              <IconSearch size={16} />
              <input
                placeholder="Поиск по системе…"
                className="w-full bg-transparent text-loko-text-primary placeholder:text-loko-text-muted focus:outline-none"
              />
            </div>
            <span className="hidden sm:flex badge badge-success gap-1.5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-loko-success animate-pulse" />
              <span className="hidden md:inline">Участник / планшет</span>
              <span className="md:hidden">OK</span>
            </span>
            <span className="hidden lg:flex badge badge-neutral gap-1.5 px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-loko-success" />
              Система OK
            </span>
            <Link to="/admin/offers" className="hidden sm:flex btn-brand px-3 md:px-4 py-2 text-sm">
              <IconPlus size={16} />
              <span className="hidden md:inline">Новая акция</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 py-4 md:py-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* МОБИЛЬНАЯ НИЖНЯЯ НАВИГАЦИЯ */}
      <nav className="fixed bottom-0 inset-x-0 z-30 flex lg:hidden border-t border-loko-bg-border bg-loko-bg-base/95 backdrop-blur-xl safe-area-bottom">
        {[
          { to: '/admin', label: 'Дашборд', icon: <IconDashboard size={20} />, end: true },
          { to: '/admin/organizations', label: 'Орг.', icon: <IconBuilding size={20} /> },
          { to: '/admin/offers', label: 'Акции', icon: <IconGift size={20} /> },
          { to: '/admin/coupons', label: 'Купоны', icon: <IconTicket size={20} /> },
          { to: '/admin/tablets', label: 'Ещё', icon: <IconInbox size={20} /> },
        ].map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
                isActive ? 'text-loko-pink' : 'text-loko-text-muted'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

// Вспомогательный компонент: подсказка о доступе
export const AccessHint: FC = () => (
  <div className="card mt-4 flex items-center gap-3 border-loko-pink/30 bg-loko-pink/5 p-4 text-sm text-loko-text-secondary">
    <IconShield size={18} className="text-loko-pink" />
    <span>Контур администратора. Доступ только внутренней команде ЯОКО.</span>
  </div>
)
