import { useState, useEffect } from 'react'
import { couponsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { IconCheck, IconClose, IconTicket, IconShield, IconClock, IconSearch } from '@/components/ui/icons'

type RedeemState = 'idle' | 'checking' | 'success' | 'error'

export function PartnerRedeem() {
  const { user } = useAuth()
  const [code, setCode] = useState('')
  const [state, setState] = useState<RedeemState>('idle')
  const [err, setErr] = useState<string>('')
  const [foundCoupon, setFoundCoupon] = useState<any>(null)
  const [allCoupons, setAllCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Загружаем все купоны организации
  useEffect(() => {
    if (!user?.organization_id) return
    couponsApi.list({ organization_id: user.organization_id, limit: 100 })
      .then(data => {
        // Фильтруем только купоны акций нашей организации
        setAllCoupons(data.filter(c => c.organization_id === user.organization_id))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

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
        // Обновляем список купонов
        setAllCoupons(prev => prev.map(c => c.id === foundCoupon.id ? { ...c, status: 'redeemed' } : c))
      })
      .catch(e => {
        setState('error')
        setErr(e.message || 'Ошибка погашения')
      })
  }

  const handleRedeemFromList = (couponId: string) => {
    if (!confirm('Погасить купон?')) return
    couponsApi.redeem(couponId, 'Сотрудник')
      .then(() => {
        // Обновляем список купонов
        setAllCoupons(prev => prev.map(c => c.id === couponId ? { ...c, status: 'redeemed' } : c))
      })
      .catch(e => {
        alert(e.message || 'Ошибка погашения')
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
        <p className="mt-1 text-sm text-loko-text-secondary">Введите код или выберите из списка ниже.</p>
      </div>

      <div className="card p-6 mb-6">
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
      </div>

      {/* Список всех купонов организации */}
      <div className="card p-6">
        <h3 className="text-base font-semibold text-loko-text-primary mb-4">Все купоны организации</h3>
        {loading ? (
          <div className="py-8 text-center text-sm text-loko-text-muted">Загрузка…</div>
        ) : allCoupons.length === 0 ? (
          <div className="py-8 text-center text-sm text-loko-text-muted">Нет купонов</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-loko-bg-border text-xs text-loko-text-muted">
                  <th className="pb-2 text-left font-medium">Клиент</th>
                  <th className="pb-2 text-left font-medium">Телефон</th>
                  <th className="pb-2 text-left font-medium">Акция</th>
                  <th className="pb-2 text-left font-medium">Код</th>
                  <th className="pb-2 text-left font-medium">Дата</th>
                  <th className="pb-2 text-left font-medium">Статус</th>
                  <th className="pb-2 text-right font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {allCoupons.map(c => (
                  <tr key={c.id} className="border-b border-loko-bg-border/40 last:border-b-0">
                    <td className="py-3 text-loko-text-primary">{c.user_name || '—'}</td>
                    <td className="py-3 text-loko-text-secondary">{c.user_phone || '—'}</td>
                    <td className="py-3 text-loko-text-primary">{c.offer_title}</td>
                    <td className="py-3 font-mono text-xs text-loko-pink">{c.code}</td>
                    <td className="py-3 text-loko-text-muted">{new Date(c.issued_at).toLocaleDateString('ru')}</td>
                    <td className="py-3">
                      {c.status === 'redeemed' ? (
                        <span className="badge badge-success">Погашен</span>
                      ) : c.status === 'expired' ? (
                        <span className="badge badge-neutral">Истёк</span>
                      ) : (
                        <span className="badge badge-violet">Выдан</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {c.status === 'issued' && (
                        <button
                          onClick={() => handleRedeemFromList(c.id)}
                          className="btn-brand text-xs px-3 py-1"
                        >
                          <IconCheck size={12} />Погасить
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
