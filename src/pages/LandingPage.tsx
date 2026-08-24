import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { YaokoLogo } from '@/components/brand/YaokoLogo'
import { IconArrowRight, IconLogo, IconSpark, IconShield, IconTrend } from '@/components/ui/icons'

const surfaces = [
  {
    to: '/admin',
    title: 'Админ-панель',
    subtitle: 'Полный контроль трафика, участников, акций и купонов',
    icon: <IconLogo size={28} />,
    color: 'from-loko-pink/30 to-loko-violet/30',
    accent: 'bg-gradient-brand',
  },
  {
    to: '/partner',
    title: 'Кабинет партнёра',
    subtitle: 'Лиды по вашим акциям, погашение купонов и аналитика',
    icon: <IconTrend size={28} />,
    color: 'from-loko-violet/30 to-loko-purple/30',
    accent: 'bg-gradient-to-br from-loko-violet to-loko-purple',
  },
  {
    to: '/tablet',
    title: 'Клиентский планшет',
    subtitle: 'Регистрация, барабан, купон — клиентский сценарий',
    icon: <IconSpark size={28} />,
    color: 'from-loko-purple/30 to-loko-pink/30',
    accent: 'bg-gradient-to-br from-loko-purple to-loko-pink',
  },
]

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Орнамент фона */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-loko-pink/20 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-[480px] w-[480px] rounded-full bg-loko-violet/25 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.04]" aria-hidden="true">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-6 md:py-8">
        {/* Хедер */}
        <header className="flex items-center justify-between">
          <YaokoLogo className="h-10 md:h-16" withTagline />
          <div className="hidden items-center gap-2 text-xs text-loko-text-muted md:flex">
            <IconShield size={14} />
            MVP · v0.1 · 20.08.2026
          </div>
        </header>

        {/* Hero */}
        <div className="flex flex-1 flex-col items-center justify-center text-center pt-6 md:pt-0">
          {/* <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 0.8 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <img
              src="/yaoko.png"
              alt="ЯОКО"
              className="mx-auto h-28 w-auto sm:h-36 md:h-[27rem]"
            />
          </motion.div> */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="badge badge-pink mb-4 md:mb-5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-loko-pink animate-pulse" />
            MVP · Локальные акции и лидогенерация
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-3xl text-balance text-2xl font-bold leading-tight tracking-tight text-loko-text-primary sm:text-4xl md:text-6xl"
          >
            Платформа <span className="text-gradient">локальных акций</span> для офлайн-бизнеса
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-3 md:mt-5 max-w-2xl text-pretty text-sm text-loko-text-secondary md:text-lg"
          >
            Планшет в точке · регистрация по телефону · барабан с акциями · одноразовый купон.
            Три контура: админ, партнёр, клиент.
          </motion.p>

          {/* Карточки выбора контура */}
          <div className="mt-8 md:mt-12 grid w-full grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
            {surfaces.map((s, i) => (
              <motion.div
                key={s.to}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              >
                <Link
                  to={s.to}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl md:rounded-3xl border border-loko-bg-border bg-loko-bg-surface/60 p-4 md:p-6 text-left backdrop-blur-xl transition-all hover:border-loko-pink/40 hover:bg-loko-bg-elevated/70"
                >
                  <div className={`pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br ${s.color} blur-2xl transition-all group-hover:scale-125`} />
                  <div className={`relative inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl ${s.accent} text-white shadow-glow-soft`}>
                    {s.icon}
                  </div>
                  <h3 className="mt-3 md:mt-5 text-base md:text-lg font-semibold text-loko-text-primary">{s.title}</h3>
                  <p className="mt-1 text-xs md:text-sm text-loko-text-secondary">{s.subtitle}</p>
                  <div className="mt-4 md:mt-6 flex items-center gap-2 text-xs md:text-sm font-medium text-loko-pink">
                    Открыть контур
                    <IconArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Футер */}
        <footer className="mt-8 md:mt-12 text-center text-xs text-loko-text-muted">
          © 2026 ЯОКО · Local Promotions Platform ·
        </footer>
      </div>
    </div>
  )
}
