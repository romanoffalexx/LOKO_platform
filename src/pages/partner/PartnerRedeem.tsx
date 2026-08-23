import { useState, useEffect } from 'react'
import { couponsApi } from '@/lib/api'
import { IconCheck, IconClose, IconTicket, IconShield, IconClock } from '@/components/ui/icons'

type RedeemState = 'idle' | 'checking' | 'success' | 'error'

export function PartnerRedeem() {
  const [code, setCode] = useState('')
  const [state, setState] = useState<RedeemState>('idle')
  const [err, setErr] = useState<string>('')
  const [foundCoupon, setFoundCoupon] = useState<any>(null)
  const [recentCoupons, setRecentCoupons] = useState<any[]>([])

  // Загружаем последние купоны для подсказки
  useEffect(() => {
    couponsApi.list({ limit: 3 }).then(setRecentCoupons).catch(() => {})
  }, [])

  const handleCheck = () => {
    setState('checking')
    setErr('')
    setFoundCoupon(null)

    couponsApi.findByCode(code.trim())
      .then(coupon => {
        if (!coupon) {
          setState('error')
          setErr('Купон не найден')
          return
        }
        if (coupon.status === 'redeemed') {
          setState('error')
          setErr('Купон уже погашен')
          return
        }
        if (coupon.status === 'expired') {
          setState('error')
          setErr('Срок действия купона истёк')
          return
        }
        setFoundCoupon(coupon)
        setState('success')
      })
      .catch(() => {
        setState('error')
        setErr('Ошибка поиска купона')
      })
  }

  const handleRedeem = () => {
    if (!foundCoupon) return
    couponsApi.redeem(foundCoupon.id, 'Сотрудник')
      .then(() => {
        setState('success')
        setFoundCoupon({ ...foundCoupon, status: 'redeemed' })
      })
      .catch(e => {
        setState('error')
        setErr(e.message || 'Ошибка погашения')
      })
  }

  const reset = () => {
    setCode('')
    setState('idle')
    setErr('')
    setFoundCoupon(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Погасить купон</h1>
        <p className="mt-1 text-sm text-loko-text-secondary">Введите код, который предъявил клиент.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <label className="text-sm text-loko-text-secondary">Код купона</label>
          <div className="mt-2 flex gap-2">
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setState('idle') }}
              placeholder="LOKO-XXXX-XXXX"
              className="input flex-1 font-mono text-base uppercase tracking-wider"
              autoFocus
            />
            <button onClick={handleCheck} disabled={!code || state === 'checking'} className="btn-brand">
              {state === 'checking' ? 'Проверка…' : 'Проверить'}
            </button>
          </div>

          <div className="mt-4 min-h-[120px]">
            {state === 'idle' && (
              <div className="rounded-2xl border border-dashed border-loko-bg-border p-6 text-sm text-loko-text-muted">
                Введите код, чтобы увидеть информацию о купоне и организации.
              </div>
            )}

            {state === 'success' && foundCoupon && (
              <div className="rounded-2xl border border-loko-success/30 bg-loko-success/10 p-4">
                <div className="flex items-center gap-2 text-loko-success">
                  <IconCheck size={18} />
                  <span className="text-sm font-semibold">Купон действителен</span>
                </div>
                <div className="mt-2 text-sm text-loko-text-primary">
                  Клиент <b>{foundCoupon.user_name || '—'}</b> · акция «{foundCoupon.offer_title}» · {foundCoupon.organization_name}
                </div>
                <div className="mt-3 flex gap-2">
                  {foundCoupon.status !== 'redeemed' ? (
                    <button onClick={handleRedeem} className="btn-brand"><IconCheck size={14} />Погасить</button>
                  ) : (
                    <span className="badge badge-success">Погашен</span>
                  )}
                  <button onClick={reset} className="btn-ghost"><IconClose size={14} />Отмена</button>
                </div>
              </div>
            )}

            {state === 'error' && (
              <div className="rounded-2xl border border-loko-danger/30 bg-loko-danger/10 p-4">
                <div className="flex items-center gap-2 text-loko-danger">
                  <IconClose size={18} />
                  <span className="text-sm font-semibold">Невозможно погасить</span>
                </div>
                <div className="mt-2 text-sm text-loko-text-primary">{err}</div>
                <div className="mt-3">
                  <button onClick={reset} className="btn-ghost">Сбросить</button>
                </div>
              </div>
            )}
          </div>

          <div className="divider my-5" />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { icon: <IconTicket size={18} />, title: 'Одноразовый', desc: 'Повторное погашение невозможно' },
              { icon: <IconClock size={18} />, title: 'Срок — до конца акции', desc: 'Обратный отсчёт в купоне клиента' },
              { icon: <IconShield size={18} />, title: 'Только ваши купоны', desc: 'Чужие организации не пройдут' },
            ].map(b => (
              <div key={b.title} className="card-elevated p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-loko-bg-base/60 text-loko-pink">{b.icon}</div>
                <div className="mt-2 text-sm font-semibold text-loko-text-primary">{b.title}</div>
                <div className="text-xs text-loko-text-muted">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-loko-text-primary">Последние купоны</h3>
          <p className="mt-2 text-sm text-loko-text-secondary">
            Нажмите на код, чтобы подставить:
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-xs font-mono text-loko-pink">
            {recentCoupons.length === 0 && (
              <li className="text-loko-text-muted">Пока нет купонов</li>
            )}
            {recentCoupons.map(c => (
              <li key={c.id} className="cursor-pointer hover:underline" onClick={() => setCode(c.code)}>
                {c.code}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
