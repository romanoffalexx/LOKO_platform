import { useState, useEffect, type FC } from 'react'
import { offersApi, pointOffersApi, pointsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { IconGift, IconPin, IconClock, IconCheck } from '@/components/ui/icons'

export const PartnerOffers: FC = () => {
  const { user } = useAuth()
  const [offers, setOffers] = useState<any[]>([])
  const [pointOffers, setPointOffers] = useState<any[]>([])
  const [points, setPoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'mine' | 'assigned'>('mine')

  useEffect(() => {
    Promise.all([
      offersApi.list(),
      pointOffersApi.list(),
      pointsApi.list(),
    ]).then(([offersData, poData, pointsData]) => {
      const orgId = user?.organization_id
      setOffers(offersData.filter((o: any) => o.organization_id === orgId))
      setPointOffers(poData)
      setPoints(pointsData)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  // Точки партнёра
  const myPointIds = new Set(points.map(p => p.id))

  // Акции, назначенные на точки партнёра (чужие акции, которые можно показывать)
  const assignedPointOffersers = pointOffers.filter(po =>
    myPointIds.has(po.point_id) && po.offer_org_id !== user?.organization_id
  )

  const mine = tab === 'mine' ? offers : []
  const totalIssued = offers.reduce((s, o) => s + Number(o.total_issued ?? 0), 0)
  const totalRedeemed = offers.reduce((s, o) => s + Number(o.total_redeemed ?? 0), 0)

  if (loading) return <div className="py-12 text-center text-sm text-loko-text-muted">Загрузка…</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Акции</h1>
        <p className="mt-1 text-sm text-loko-text-secondary">Ваши акции и акции, назначенные на ваши точки.</p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="metric-card">
          <div className="text-sm text-loko-text-secondary">Ваших акций</div>
          <div className="mt-1 text-2xl font-bold text-loko-text-primary">{offers.length}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-loko-text-secondary">Выдано купонов</div>
          <div className="mt-1 text-2xl font-bold text-loko-text-primary">{totalIssued}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-loko-text-secondary">Погашено</div>
          <div className="mt-1 text-2xl font-bold text-loko-pink">{totalRedeemed}</div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1 rounded-xl border border-loko-bg-border bg-loko-bg-base/40 p-1 text-sm w-fit">
        <button onClick={() => setTab('mine')} className={`rounded-lg px-3 py-1.5 ${tab === 'mine' ? 'bg-loko-bg-elevated text-loko-text-primary' : 'text-loko-text-secondary'}`}>
          Мои акции
        </button>
        <button onClick={() => setTab('assigned')} className={`rounded-lg px-3 py-1.5 ${tab === 'assigned' ? 'bg-loko-bg-elevated text-loko-text-primary' : 'text-loko-text-secondary'}`}>
          Назначенные ({assignedPointOffersers.length})
        </button>
      </div>

      {tab === 'mine' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {mine.length === 0 && (
            <div className="card col-span-full p-8 text-center text-sm text-loko-text-muted">
              У вас пока нет акций
            </div>
          )}
          {mine.map(o => (
            <div key={o.id} className="card overflow-hidden">
              <div className="relative h-24" style={{ background: o.bg_gradient }}>
                <div className="absolute right-2 top-2 text-3xl">{o.emoji}</div>
                <div className="absolute bottom-2 left-3 right-3">
                  <div className="text-sm font-bold text-white">{o.title}</div>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-loko-text-muted">
                  <IconClock size={12} />{o.starts_at?.slice(0, 10)} → {o.ends_at?.slice(0, 10)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-loko-bg-base/40 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Выдано</div>
                    <div className="text-sm font-semibold text-loko-text-primary">{o.total_issued ?? 0}</div>
                  </div>
                  <div className="rounded-lg bg-loko-bg-base/40 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Погаш.</div>
                    <div className="text-sm font-semibold text-loko-pink">{o.total_redeemed ?? 0}</div>
                  </div>
                </div>
                <span className={`badge ${o.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                  {o.status === 'active' ? 'идёт' : o.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'assigned' && (
        <div className="flex flex-col gap-2">
          {assignedPointOffersers.length === 0 && (
            <div className="card p-8 text-center text-sm text-loko-text-muted">
              На ваши точки не назначены чужие акции
            </div>
          )}
          {assignedPointOffersers.map(po => (
            <div key={po.id} className="card flex items-center gap-3 p-4">
              <IconGift size={20} className="text-loko-pink" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-loko-text-primary">{po.offer_title}</div>
                <div className="flex items-center gap-2 text-xs text-loko-text-muted">
                  <IconPin size={12} />{po.point_name}
                  {po.max_count && <span>· лимит {po.max_count}</span>}
                  {po.issued_count != null && <span>· выдано {po.issued_count}</span>}
                </div>
              </div>
              <span className={`badge ${po.is_active ? 'badge-success' : 'badge-neutral'}`}>
                {po.is_active ? <IconCheck size={10} /> : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
