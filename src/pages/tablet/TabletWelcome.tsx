import { type FC, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { offersApi } from '@/lib/api'
import { IconArrowRight, IconSpark, IconShield, IconClock } from '@/components/ui/icons'

export const TabletWelcome: FC = () => {
  const nav = useNavigate()
  const [active, setActive] = useState<any[]>([])

  useEffect(() => {
    offersApi.list('active').then(data => setActive(data.slice(0, 4))).catch(() => {})
    // Очищаем данные предыдущей сессии
    sessionStorage.removeItem('loko_winner')
    sessionStorage.removeItem('loko_register')
    sessionStorage.removeItem('loko_consent')
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35 }}
      className="flex flex-1 flex-col"
    >
      <div className="mt-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-loko-pink/30 bg-loko-pink/10 px-3 py-1 text-xs font-semibold text-loko-pink"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-loko-pink animate-pulse" />
          Коснитесь, чтобы начать
        </motion.div>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-loko-text-primary text-balance md:text-4xl">
          Запустите барабан<br />и получите <span className="text-gradient">подарок</span>
        </h1>
        <p className="mt-2 text-sm text-loko-text-secondary text-pretty">
          Регистрация по телефону. Купон на экране. Сохраните фото.
        </p>
      </div>

      {/* Доступные акции */}
      <div className="mt-6 grid grid-cols-2 gap-2">
        {active.map((o, i) => (
          <motion.div
            key={o.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="relative h-24 overflow-hidden rounded-2xl"
            style={{ background: o.bg_gradient }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
            <div className="absolute right-2 top-2 text-3xl opacity-90">{o.emoji}</div>
            <div className="absolute bottom-2 left-2 right-2">
              <div className="text-[10px] uppercase tracking-wider text-white/80">{o.organization_name}</div>
              <div className="line-clamp-2 text-xs font-semibold text-white">{o.title}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => nav('/tablet/register')}
        className="btn-brand mt-6 w-full text-base py-4 animate-glow-pulse"
      >
        <IconSpark size={18} />
        Начать
        <IconArrowRight size={16} />
      </button>

      <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-loko-text-muted">
        <div className="flex items-center gap-1.5"><IconClock size={12} />~ 30 секунд</div>
        <div className="flex items-center gap-1.5"><IconShield size={12} />Без SMS</div>
      </div>
    </motion.div>
  )
}
