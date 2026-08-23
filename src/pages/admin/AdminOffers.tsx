import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { offersApi } from '@/lib/api'
import { IconSearch, IconFilter, IconDownload, IconPlus, IconCalendar, IconPin } from '@/components/ui/icons'

export function AdminOffers() {
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    offersApi.list()
      .then(setOffers)
      .catch(err => console.error('[Offers]', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Акции</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Календарный период, разрешённые точки, визуал, условия.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-loko-bg-border bg-loko-bg-surface/50 px-3 py-2 text-sm text-loko-text-muted md:w-64">
            <IconSearch size={16} />
            <input placeholder="Поиск акции…" className="w-full bg-transparent text-loko-text-primary placeholder:text-loko-text-muted focus:outline-none" />
          </div>
          <button className="btn-ghost"><IconFilter size={16} />Фильтры</button>
          <button className="btn-ghost"><IconDownload size={16} /></button>
          <button className="btn-brand"><IconPlus size={16} />Создать акцию</button>
        </div>
      </div>

      {loading && <div className="py-12 text-center text-sm text-loko-text-muted">Загрузка…</div>}

      {!loading && offers.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-lg font-semibold text-loko-text-primary">Пока нет акций</div>
          <p className="mt-1 text-sm text-loko-text-secondary">Создайте первую акцию.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {offers.map(o => (
          <Link key={o.id} to={`/admin/offers/${o.id}`} className="card group relative overflow-hidden transition-all hover:border-loko-pink/40">
            {/* Визуал-шапка */}
            <div className="relative h-36 overflow-hidden" style={{ background: o.bg_gradient }}>
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
              <div className="absolute right-3 top-3 text-5xl opacity-90">{o.emoji}</div>
              <div className="absolute bottom-3 left-4 right-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/70">{o.organization_name}</div>
                <div className="mt-0.5 text-lg font-bold leading-tight text-white">{o.title}</div>
              </div>
            </div>

            <div className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-xs text-loko-text-muted">
                <IconCalendar size={12} />
                {o.starts_at?.slice(0, 10)} → {o.ends_at?.slice(0, 10)}
              </div>
              <div className="flex items-center gap-2 text-xs text-loko-text-muted">
                <IconPin size={12} />{o.zone}
              </div>
              <p className="line-clamp-2 text-sm text-loko-text-secondary">{o.description}</p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="rounded-lg bg-loko-bg-base/40 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Выдано</div>
                  <div className="text-sm font-semibold text-loko-text-primary">{o.total_issued}</div>
                </div>
                <div className="rounded-lg bg-loko-bg-base/40 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Погаш.</div>
                  <div className="text-sm font-semibold text-loko-pink">{o.total_redeemed}</div>
                </div>
                <div className="rounded-lg bg-loko-bg-base/40 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Вес</div>
                  <div className="text-sm font-semibold text-loko-text-primary">{o.weight}</div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className={`badge ${o.status === 'active' ? 'badge-success' : o.status === 'scheduled' ? 'badge-violet' : 'badge-neutral'}`}>
                  {o.status === 'active' ? 'идёт' : o.status === 'scheduled' ? 'запланирована' : 'архив'}
                </span>
                <span className="text-xs text-loko-text-muted">{(o.allowed_org_ids ?? []).length} точек</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
