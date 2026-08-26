import { useEffect, useState } from 'react'
import { offersApi, couponsApi, leadsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { IconGift, IconTicket, IconTrend, IconUsers, IconPhone } from '@/components/ui/icons'

export function PartnerOverview() {
  const { user } = useAuth()
  const [myOffers, setMyOffers] = useState<any[]>([])
  const [myLeads, setMyLeads] = useState<any[]>([])
  const [myCoupons, setMyCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.organization_id) return
    // Загружаем все данные параллельно
    Promise.all([
      offersApi.list(),
      leadsApi.list(),
      couponsApi.list(),
    ]).then(([offers, leads, coupons]) => {
      const orgId = user.organization_id
      setMyOffers(offers.filter(o => o.organization_id === orgId))
      setMyLeads(leads.filter(l => l.organization_id === orgId))
      setMyCoupons(coupons.filter(c => c.organization_id === orgId))
    }).catch(err => console.error('[PartnerOverview]', err))
      .finally(() => setLoading(false))
  }, [user])

  const redeemed = myCoupons.filter(c => c.status === 'redeemed').length
  const convPct = myCoupons.length > 0 ? `${(redeemed / myCoupons.length * 100).toFixed(1)}%` : '—'

  if (loading) return <div className="py-12 text-center text-sm text-loko-text-muted">Загрузка…</div>

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Обзор</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">{myOffers[0]?.organization_name ?? 'Партнёр'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="metric-card">
          <div className="text-sm text-loko-text-secondary">Лиды</div>
          <div className="mt-1 text-2xl font-bold text-loko-text-primary">{myLeads.length}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-loko-text-secondary">Выдано купонов</div>
          <div className="mt-1 text-2xl font-bold text-loko-text-primary">{myCoupons.length}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-loko-text-secondary">Погашено</div>
          <div className="mt-1 text-2xl font-bold text-loko-pink">{redeemed}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-loko-text-secondary">Конверсия</div>
          <div className="mt-1 text-2xl font-bold text-loko-text-primary">{convPct}</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-loko-text-primary">Активные акции</h3>
            <span className="text-xs text-loko-text-muted">{myOffers.length} акций</span>
          </div>
          <div className="flex flex-col gap-3">
            {myOffers.length === 0 && (
              <div className="rounded-xl border border-dashed border-loko-bg-border p-6 text-center text-sm text-loko-text-muted">
                Нет активных акций
              </div>
            )}
            {myOffers.map(o => (
              <div key={o.id} className="card-elevated flex items-center gap-3 p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: o.bg_gradient }}>{o.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-loko-text-primary">{o.title}</div>
                  <div className="text-xs text-loko-text-muted">{o.starts_at?.slice(0, 10)} → {o.ends_at?.slice(0, 10)} · {o.total_issued} выдано · {o.total_redeemed} погашено</div>
                </div>
                <span className={`badge ${o.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                  {o.status === 'active' ? 'идёт' : o.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-loko-text-primary">Свежие лиды</h3>
          <div className="mt-3 flex flex-col gap-2">
            {myLeads.length === 0 && (
              <div className="text-sm text-loko-text-muted">Пока нет лидов</div>
            )}
            {myLeads.slice(0, 4).map(l => (
              <div key={l.id} className="card-elevated p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-loko-text-primary">{l.client_name}</div>
                    <div className="text-xs text-loko-text-muted">{l.offer_title}</div>
                  </div>
                  <a href={`tel:${l.client_phone.replace(/\D/g, '')}`} className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand text-white">
                    <IconPhone size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 card p-5">
        <h3 className="text-base font-semibold text-loko-text-primary">Источники лидов</h3>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          {/* Группируем лиды по источнику */}
          {(() => {
            const sources: Record<string, number> = {}
            myLeads.forEach(l => {
              const key = l.source_point || l.source_tablet || '—'
              sources[key] = (sources[key] || 0) + 1
            })
            const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 3)
            if (sorted.length === 0) {
              return <div className="col-span-full text-sm text-loko-text-muted">Нет данных</div>
            }
            return sorted.map(([name, count]) => (
              <div key={name} className="card-elevated p-3">
                <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Источник</div>
                <div className="mt-1 truncate text-sm font-semibold text-loko-text-primary">{name}</div>
                <div className="mt-1 text-2xl font-bold text-loko-pink">{count}</div>
              </div>
            ))
          })()}
        </div>
      </div>
    </div>
  )
}
