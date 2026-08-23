import { type FC, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { offersApi, organizationsApi } from '@/lib/api'
import { IconCamera, IconCheck, IconClock, IconPin, IconRefresh } from '@/components/ui/icons'

function genCode() {
  return `LOKO-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function diffParts(target: Date) {
  const ms = target.getTime() - Date.now()
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, finished: true }
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return { d, h, m, s, finished: false }
}

const Countdown: FC<{ to: Date }> = ({ to }) => {
  const [t, setT] = useState(diffParts(to))
  useEffect(() => {
    const id = setInterval(() => setT(diffParts(to)), 1000)
    return () => clearInterval(id)
  }, [to])

  return (
    <div className="grid grid-cols-4 gap-1.5">
      {[
        { v: t.d, label: 'дней' },
        { v: t.h, label: 'часов' },
        { v: t.m, label: 'минут' },
        { v: t.s, label: 'секунд' },
      ].map((u, i) => (
        <div key={i} className="rounded-xl border border-loko-bg-border bg-loko-bg-base/60 p-2 text-center">
          <motion.div
            key={u.v}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl font-bold tabular-nums text-gradient"
          >
            {u.v.toString().padStart(2, '0')}
          </motion.div>
          <div className="text-[10px] text-loko-text-muted">{u.label}</div>
        </div>
      ))}
    </div>
  )
}

export const TabletCoupon: FC = () => {
  const [won, setWon] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const code = useMemo(() => genCode(), [])

  useEffect(() => {
    // Читаем выигрыш из sessionStorage (сохранён в TabletSpin)
    const stored = sessionStorage.getItem('loko_winner')
    if (stored) {
      try {
        const winner = JSON.parse(stored)
        setWon(winner)
        if (winner.organization_id) {
          organizationsApi.get(winner.organization_id).then(setOrg).catch(() => {})
        }
        return
      } catch { /* fallthrough */ }
    }
    // Фолбэк: первая активная акция
    offersApi.list('active').then(data => {
      if (data.length > 0) {
        const offer = data[0]
        setWon(offer)
        organizationsApi.get(offer.organization_id).then(setOrg).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  // Лёгкая «shimmer» анимация фона
  const x = useMotionValue(0)
  const bgX = useTransform(x, v => `${v}%`)
  useEffect(() => {
    const controls = animate(x, 100, { duration: 2.5, ease: 'linear', repeat: Infinity, repeatType: 'reverse' })
    return controls.stop
  }, [x])

  if (!won) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm text-loko-text-muted">Загрузка…</div>
      </div>
    )
  }

  const expiresAt = new Date(won.ends_at)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-brand shadow-glow-strong"
        >
          <IconCheck size={28} className="text-white" />
        </motion.div>
        <h2 className="mt-3 text-2xl font-bold text-loko-text-primary">Ваш купон готов</h2>
        <p className="mt-1 text-sm text-loko-text-secondary">Сфотографируйте экран и покажите на кассе</p>
      </div>

      {/* КУПОН */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative mt-5 overflow-hidden rounded-3xl border border-loko-bg-border shadow-glow-strong"
      >
        {/* Визуал-шапка акции */}
        <div className="relative h-40 overflow-hidden" style={{ background: won.bg_gradient }}>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
          <motion.div style={{ background: bgX }} className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.2),transparent)] bg-[length:200%_100%]" />
          <div className="absolute right-3 top-3 text-6xl drop-shadow-lg">{won.emoji}</div>
          <div className="absolute bottom-3 left-4 right-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80">{won.organization_name}</div>
            <div className="text-lg font-bold leading-tight text-white">{won.title}</div>
          </div>
        </div>

        {/* Тело купона */}
        <div className="bg-loko-bg-elevated/95 p-5">
          <div className="flex items-center gap-2 text-xs text-loko-text-muted">
            <IconPin size={12} />{org?.address ?? '—'}
          </div>
          <div className="mt-1 text-sm text-loko-text-secondary">{won.description}</div>

          <div className="divider my-4" />

          <div>
            <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Код купона</div>
            <div className="mt-1 rounded-xl border border-loko-pink/30 bg-loko-pink/5 p-3 text-center font-mono text-lg tracking-[0.2em] text-loko-pink shadow-glow-soft">
              {code}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-loko-text-muted">
              <IconClock size={12} />До конца использования
            </div>
            <Countdown to={expiresAt} />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-dashed border-loko-bg-border pt-3 text-[10px] text-loko-text-muted">
            <span>Одноразовый · до конца акции</span>
            <span>ЯОКО · {new Date().toLocaleDateString('ru')}</span>
          </div>

          {/* Перфорация «билета» */}
          <div className="pointer-events-none absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-loko-bg-base" />
          <div className="pointer-events-none absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-loko-bg-base" />
        </div>
      </motion.div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button className="btn-outline">
          <IconCamera size={16} />Сфотографировать
        </button>
        <Link to="/tablet" className="btn-ghost">
          <IconRefresh size={16} />Новая попытка
        </Link>
      </div>

      <div className="mt-3 text-center text-[10px] text-loko-text-muted">
        Покажите купон сотруднику. Сотрудник погасит его вручную по коду.
      </div>
    </motion.div>
  )
}
