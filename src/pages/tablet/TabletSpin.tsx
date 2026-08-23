import { type FC, useRef, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import gsap from 'gsap'
import { offersApi } from '@/lib/api'
import { IconSpark, IconArrowRight } from '@/components/ui/icons'

/* ─── Типы ──────────────────────────────────────────────── */
interface OfferItem {
  id: string
  title: string
  emoji: string
  organization_name: string
  bg_gradient: string
}

/* ─── Фолбэк если API не ответил ────────────────────────── */
const FALLBACK: OfferItem[] = [
  { id: 'fb1', title: '-20% на кофе', emoji: '☕', organization_name: 'Кофейня «Луч»', bg_gradient: '' },
  { id: 'fb2', title: 'Десерт бесплатно', emoji: '🍰', organization_name: '«Вкусный Дом»', bg_gradient: '' },
  { id: 'fb3', title: 'Бесплатный час', emoji: '🎬', organization_name: 'Студия «Атмосфера»', bg_gradient: '' },
  { id: 'fb4', title: 'Пицца 2×1', emoji: '🍕', organization_name: 'Пиццерия «Огонь»', bg_gradient: '' },
  { id: 'fb5', title: 'Напиток в подарок', emoji: '🥤', organization_name: 'ТРЦ «Северный»', bg_gradient: '' },
  { id: 'fb6', title: 'Скидка 15%', emoji: '🎁', organization_name: '«Вкусный Дом»', bg_gradient: '' },
]

/* ─── Константы барабана ────────────────────────────────── */
const REPEATS = 8   // повторов набора для длинной ленты
const VISIBLE = 3   // карточек видно в окне
const IH = 120      // высота одной карточки, px

/* ─── Карточка ленты ────────────────────────────────────── */
const ReelCard: FC<{ offer: OfferItem; highlight?: boolean }> = ({ offer, highlight }) => (
  <div
    className={`mx-3 flex items-center gap-4 rounded-2xl border px-5 transition-colors duration-300 ${
      highlight
        ? 'border-loko-pink/50 bg-gradient-to-r from-loko-pink/15 via-loko-bg-elevated to-loko-purple/15 shadow-glow'
        : 'border-loko-bg-border/60 bg-loko-bg-elevated/50'
    }`}
    style={{ height: IH - 10, flexShrink: 0 }}
  >
    <div
      className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-3xl ${
        highlight ? 'bg-loko-pink/20' : 'bg-loko-bg-surface'
      }`}
    >
      {offer.emoji}
    </div>
    <div className="min-w-0 flex-1">
      <div className={`truncate text-base font-bold ${highlight ? 'text-white' : 'text-loko-text-primary'}`}>
        {offer.title}
      </div>
      <div className="mt-0.5 truncate text-xs text-loko-text-muted">
        {offer.organization_name}
      </div>
    </div>
  </div>
)

/* ─── Слот-барабан (GSAP) ──────────────────────────────── */
const SlotDrum: FC<{
  items: OfferItem[]
  spinning: boolean
  winnerIndex: number
  onDone: () => void
}> = ({ items, spinning, winnerIndex, onDone }) => {
  const stripRef = useRef<HTMLDivElement>(null)
  const posRef = useRef(0)
  const doneRef = useRef(false)

  useEffect(() => {
    if (!spinning || !stripRef.current) return
    doneRef.current = false

    const R = items.length
    const landIdx = winnerIndex + (REPEATS - 2) * R
    const viewCenter = (VISIBLE * IH) / 2
    const target = landIdx * IH + IH / 2 - viewCenter

    const from = posRef.current
    const to = target

    const proxy = { v: from }

    const tl = gsap.timeline({
      onComplete: () => {
        posRef.current = to
        if (!doneRef.current) {
          doneRef.current = true
          onDone()
        }
      },
    })

    // Основной прокрут с овершутом
    tl.to(proxy, {
      v: to + 12,
      duration: 3.8,
      ease: 'power4.out',
      onUpdate: () => {
        if (stripRef.current) {
          stripRef.current.style.transform = `translateY(${-proxy.v}px)`
        }
      },
    })

    // Небольшой отскок назад
    tl.to(proxy, {
      v: to,
      duration: 0.35,
      ease: 'back.out(2)',
      onUpdate: () => {
        if (stripRef.current) {
          stripRef.current.style.transform = `translateY(${-proxy.v}px)`
        }
      },
    })

    return () => { tl.kill() }
  }, [spinning, winnerIndex, items, onDone])

  // Лента: REPEATS повторов набора
  const strip = Array.from({ length: REPEATS }, () => items).flat()

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ height: VISIBLE * IH }}
    >
      {/* Фейд-маски сверху и снизу */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-loko-bg-base to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-loko-bg-base to-transparent" />

      {/* Центральная линия-индикатор */}
      <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: '50%', transform: 'translateY(-50%)' }}>
        <div className="mx-4 h-[2px] bg-gradient-to-r from-transparent via-loko-pink/80 to-transparent" />
        <div className="mx-4 h-[2px] bg-gradient-to-r from-transparent via-loko-pink/40 to-transparent blur-sm" />
      </div>

      {/* Стрелки-указатели */}
      <div className="pointer-events-none absolute left-1 z-20 top-1/2 -translate-y-1/2">
        <div className="h-0 w-0 border-t-[6px] border-b-[6px] border-l-[8px] border-t-transparent border-b-transparent border-l-loko-pink" />
      </div>
      <div className="pointer-events-none absolute right-1 z-20 top-1/2 -translate-y-1/2">
        <div className="h-0 w-0 border-t-[6px] border-b-[6px] border-r-[8px] border-t-transparent border-b-transparent border-r-loko-pink" />
      </div>

      {/* Лента карточек */}
      <div ref={stripRef} className="will-change-transform">
        {strip.map((offer, i) => (
          <ReelCard
            key={i}
            offer={offer}
            highlight={spinning ? false : i % items.length === winnerIndex && i >= (REPEATS - 2) * items.length}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Главный компонент ─────────────────────────────────── */
export const TabletSpin: FC = () => {
  const nav = useNavigate()
  const [offers, setOffers] = useState<OfferItem[]>([])
  const [spinning, setSpinning] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const winnerRef = useRef(0)

  useEffect(() => {
    offersApi
      .list('active')
      .then((data) => {
        if (data.length === 0) setOffers(FALLBACK)
        else setOffers(data.slice(0, 8))
      })
      .catch(() => setOffers(FALLBACK))
  }, [])

  const start = useCallback(() => {
    if (offers.length === 0 || spinning) return
    winnerRef.current = Math.floor(Math.random() * offers.length)
    setDone(false)
    setSpinning(true)
  }, [offers.length, spinning])

  const onDone = useCallback(() => {
    setSpinning(false)
    setDone(true)
    // Сохраняем выигрыш для страницы купона
    const winner = offers[winnerRef.current]
    if (winner) sessionStorage.setItem('loko_winner', JSON.stringify(winner))
  }, [offers])

  /* Загрузка / ошибка */
  if (offers.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-loko-pink border-t-transparent" />
          <div className="mt-3 text-sm text-loko-text-muted">
            {error ? `Ошибка: ${error}` : 'Загрузка акций…'}
          </div>
          {error && (
            <button onClick={() => location.reload()} className="btn-ghost mt-3 text-xs">
              Повторить
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col"
    >
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-loko-text-primary">Барабан</h2>
        <p className="mt-1 text-sm text-loko-text-secondary">
          {spinning
            ? 'Выбираем победителя…'
            : done
              ? 'Готово! Покажите купон на кассе'
              : 'Коснитесь кнопки, чтобы запустить'}
        </p>
      </div>

      {/* Барабан */}
      <div className="relative mt-5 rounded-3xl border border-loko-bg-border bg-loko-bg-base/60 p-3">
        {/* Декоративные подсветки */}
        <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-loko-pink/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-loko-violet/30 blur-3xl" />

        <SlotDrum
          items={offers}
          spinning={spinning}
          winnerIndex={winnerRef.current}
          onDone={onDone}
        />

        {/* CTA-оверлей */}
        <AnimatePresence>
          {!spinning && !done && (
            <motion.button
              key="cta"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={start}
              className="absolute inset-0 flex items-center justify-center rounded-3xl bg-loko-bg-base/40 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-brand text-white shadow-glow-strong"
                >
                  <IconSpark size={32} />
                </motion.div>
                <div className="text-sm font-semibold text-white drop-shadow-md">Запустить</div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Результат */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
            className="mt-5"
          >
            <div className="card-elevated border-loko-success/30 bg-loko-success/10 p-5 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
                className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-loko-success/20 text-2xl"
              >
                🎉
              </motion.div>
              <div className="text-xs font-medium uppercase tracking-wider text-loko-success">
                Победа!
              </div>
              <div className="mt-1 text-lg font-bold text-loko-text-primary">
                {offers[winnerRef.current].title}
              </div>
              <div className="text-xs text-loko-text-secondary">
                {offers[winnerRef.current].organization_name}
              </div>
            </div>

            <button
              onClick={() => nav('/tablet/coupon')}
              className="btn-brand mt-4 w-full py-4 text-base"
            >
              Показать купон
              <IconArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
