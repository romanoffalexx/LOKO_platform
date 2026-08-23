import { type FC, type ReactNode } from 'react'
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { YaokoLogo } from '@/components/brand/YaokoLogo'
import { useAuth } from '@/lib/auth'
import {
  IconDashboard, IconUsers, IconTicket, IconLogo, IconLogout, IconBell, IconSettings, IconGift, IconInbox,
} from '@/components/ui/icons'

const partnerNav: { to: string; label: string; icon: ReactNode; end?: boolean }[] = [
  { to: '/partner', label: 'Обзор', icon: <IconDashboard size={18} />, end: true },
  { to: '/partner/leads', label: 'Лиды', icon: <IconUsers size={18} /> },
  { to: '/partner/offers', label: 'Акции', icon: <IconGift size={18} /> },
  { to: '/partner/tickets', label: 'Обращения', icon: <IconInbox size={18} /> },
  { to: '/partner/redeem', label: 'Погасить купон', icon: <IconTicket size={18} /> },
]

export const PartnerLayout: FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = (user?.name || 'Л').charAt(0).toUpperCase()
  return (
    <div className="flex min-h-screen bg-loko-bg-base text-loko-text-primary">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-loko-bg-border bg-loko-bg-surface/60 px-4 py-5 backdrop-blur-xl lg:flex">
        <Link to="/partner" className="mb-7 flex items-center gap-3 px-2">
          <IconLogo size={28} />
          <YaokoLogo className="h-10" />
        </Link>

        <div className="card-elevated mb-5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-base font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-loko-text-primary">{user?.organization_name || 'Партнёр'}</div>
              <div className="text-xs text-loko-text-muted">Партнёр · {user?.name || ''}</div>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {partnerNav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 flex flex-col gap-1 border-t border-loko-bg-border pt-3">
          <button className="nav-item"><IconBell size={18} /><span>Уведомления</span></button>
          <button className="nav-item"><IconSettings size={18} /><span>Настройки</span></button>
          <button onClick={handleLogout} className="nav-item"><IconLogout size={18} /><span>Выйти</span></button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 md:gap-4 border-b border-loko-bg-border bg-loko-bg-base/85 px-4 md:px-6 py-3 md:py-4 backdrop-blur-xl">
          <div className="text-sm text-loko-text-secondary truncate">Партнёр · {user?.organization_name || 'Кабинет'}</div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:flex badge badge-success gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-loko-success" />
              <span className="hidden md:inline">Подключены MAX / e-mail</span>
              <span className="md:hidden">MAX</span>
            </span>
          </div>
        </header>
        <main className="flex-1 px-4 md:px-6 py-4 md:py-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* МОБИЛЬНАЯ НИЖНЯЯ НАВИГАЦИЯ */}
      <nav className="fixed bottom-0 inset-x-0 z-30 flex lg:hidden border-t border-loko-bg-border bg-loko-bg-base/95 backdrop-blur-xl safe-area-bottom">
        {[
          { to: '/partner', label: 'Обзор', icon: <IconDashboard size={20} />, end: true },
          { to: '/partner/leads', label: 'Лиды', icon: <IconUsers size={20} /> },
          { to: '/partner/offers', label: 'Акции', icon: <IconGift size={20} /> },
          { to: '/partner/tickets', label: 'Заявки', icon: <IconInbox size={20} /> },
          { to: '/partner/redeem', label: 'Погасить', icon: <IconTicket size={20} /> },
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
