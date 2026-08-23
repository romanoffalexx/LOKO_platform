import { type FC, useEffect } from 'react'
import { Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { IconLogo, IconRefresh, IconShield } from '@/components/ui/icons'
import { TabletLogin } from '@/pages/tablet/TabletLogin'
import { TabletWelcome } from '@/pages/tablet/TabletWelcome'
import { TabletRegister } from '@/pages/tablet/TabletRegister'
import { TabletConsent } from '@/pages/tablet/TabletConsent'
import { TabletSpin } from '@/pages/tablet/TabletSpin'
import { TabletCoupon } from '@/pages/tablet/TabletCoupon'

const stepLabels: Record<string, string> = {
  '': 'Старт',
  register: 'Регистрация',
  consent: 'Согласие',
  spin: 'Барабан',
  coupon: 'Купон',
}

export const TabletApp: FC = () => {
  const loc = useLocation()
  const navigate = useNavigate()
  const seg = loc.pathname.replace('/tablet', '').replace(/^\//, '') || ''
  const step = stepLabels[seg] ?? 'Шаг'
  const isLogin = seg === 'login'

  // Проверяем авторизацию планшета
  useEffect(() => {
    const tablet = sessionStorage.getItem('loko_tablet')
    if (!tablet && seg !== 'login') {
      navigate('/tablet/login', { replace: true })
    }
  }, [seg, navigate])

  // На странице логина — минимальный layout
  if (isLogin) {
    return (
      <div className="relative flex min-h-screen flex-col items-center bg-loko-bg-base text-loko-text-primary">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-loko-pink/15 blur-[120px]" />
          <div className="absolute -bottom-32 right-0 h-[420px] w-[420px] rounded-full bg-loko-violet/20 blur-[120px]" />
          <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
        </div>
        <div className="relative z-10 flex w-full max-w-md flex-1 flex-col items-stretch px-6 pt-16">
          <AnimatePresence mode="wait">
            <Routes location={loc} key={loc.pathname}>
              <Route path="login" element={<TabletLogin />} />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-loko-bg-base text-loko-text-primary">
      {/* Орнамент фона */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-loko-pink/15 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-[420px] w-[420px] rounded-full bg-loko-violet/20 blur-[120px]" />
        <div className="absolute -bottom-32 left-0 h-[420px] w-[420px] rounded-full bg-loko-purple/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />
      </div>

      {/* Шапка планшета */}
      <header className="relative z-10 flex w-full max-w-md items-center justify-between px-6 pt-6">
        <Link to="/tablet" className="flex items-center gap-2">
          <IconLogo size={28} />
          <div className="leading-none">
            <div className="text-lg font-bold tracking-tight text-loko-text-primary">ЯОКО</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-loko-text-muted">Local Promotions</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="badge badge-neutral gap-1.5 px-2 py-1 text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-loko-success animate-pulse" />
            Планшет T-042 · Центр
          </span>
          <Link to="/tablet" className="rounded-lg p-2 text-loko-text-muted hover:bg-loko-bg-elevated/40 hover:text-loko-text-primary">
            <IconRefresh size={18} />
          </Link>
        </div>
      </header>

      {/* Прогресс шага */}
      <div className="relative z-10 mt-5 flex w-full max-w-md items-center gap-1.5 px-6">
        {['register', 'consent', 'spin', 'coupon'].map((s, i) => {
          const order = ['register', 'consent', 'spin', 'coupon']
          const currentIdx = order.indexOf(seg)
          const done = currentIdx > i || seg === '' && i === 0
          const active = s === seg
          return (
            <div key={s} className="flex flex-1 items-center gap-1.5">
              <div
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  done ? 'bg-loko-pink shadow-glow' : active ? 'bg-gradient-brand' : 'bg-loko-bg-border'
                }`}
              />
            </div>
          )
        })}
      </div>

      {/* Контент */}
      <div className="relative z-10 flex w-full max-w-md flex-1 flex-col items-stretch px-6 pb-10 pt-6">
        <AnimatePresence mode="wait">
          <Routes location={loc} key={loc.pathname}>
            <Route index element={<TabletWelcome />} />
            <Route path="login" element={<TabletLogin />} />
            <Route path="register" element={<TabletRegister />} />
            <Route path="consent" element={<TabletConsent />} />
            <Route path="spin" element={<TabletSpin />} />
            <Route path="coupon" element={<TabletCoupon />} />
          </Routes>
        </AnimatePresence>
      </div>

      {/* Подвал */}
      <footer className="relative z-10 flex w-full max-w-md items-center justify-between px-6 pb-6 text-[10px] text-loko-text-muted">
        <div className="flex items-center gap-1.5">
          <IconShield size={12} />
          Шаг: {step}
        </div>
        <div>ЯОКО · MVP · 2026</div>
      </footer>
    </div>
  )
}

export default TabletApp
