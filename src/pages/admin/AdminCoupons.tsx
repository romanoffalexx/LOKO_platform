import { useEffect, useState } from 'react'
import { couponsApi } from '@/lib/api'
import { toCsv, downloadCsv } from '@/lib/csv'
import { IconSearch, IconClock, IconDownload, IconClose } from '@/components/ui/icons'

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    couponsApi.list()
      .then(setCoupons)
      .catch(err => console.error('[Coupons]', err))
      .finally(() => setLoading(false))
  }, [])

  const issued = coupons.filter(c => c.status === 'issued').length
  const redeemed = coupons.filter(c => c.status === 'redeemed').length
  const expired = coupons.filter(c => c.status === 'expired').length
  const cancelled = coupons.filter(c => c.status === 'cancelled').length

  // Фильтрация
  const filtered = coupons.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!c.code?.toLowerCase().includes(q) &&
          !c.user_name?.toLowerCase().includes(q) &&
          !c.user_phone?.includes(search) &&
          !c.offer_title?.toLowerCase().includes(q)) return false
    }
    return true
  })

  const handleExport = () => {
    const csv = toCsv(coupons, [
      { key: 'code', label: 'Код' },
      { key: 'user_name', label: 'Клиент' },
      { key: 'user_phone', label: 'Телефон' },
      { key: 'offer_title', label: 'Акция' },
      { key: 'organization_name', label: 'Организация' },
      { key: 'source_point', label: 'Точка' },
      { key: 'status', label: 'Статус' },
      { key: 'expires_at', label: 'Срок' },
    ])
    downloadCsv(csv, `coupons_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Отменить (заблокировать) купон?')) return
    try {
      await couponsApi.cancel(id)
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, status: 'cancelled' } : c))
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Купоны</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Одноразовые купоны локальных акций.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-loko-bg-border bg-loko-bg-surface/50 px-3 py-2 text-sm text-loko-text-muted md:w-64">
            <IconSearch size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Код, имя, телефон…"
              className="w-full bg-transparent text-loko-text-primary placeholder:text-loko-text-muted focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-loko-text-muted hover:text-loko-text-primary"><IconClose size={14} /></button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">Все статусы</option>
            <option value="issued">Выдан</option>
            <option value="redeemed">Погашён</option>
            <option value="expired">Истёк</option>
            <option value="cancelled">Отменён</option>
          </select>
          <button onClick={handleExport} className="btn-ghost" disabled={coupons.length === 0}><IconDownload size={16} />Экспорт CSV</button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-3">
        <div className="metric-card">
          <div className="text-sm text-loko-text-secondary">Выдано</div>
          <div className="mt-1 text-2xl font-bold text-loko-text-primary">{issued}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-loko-text-secondary">Погашено</div>
          <div className="mt-1 text-2xl font-bold text-loko-success">{redeemed}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-loko-text-secondary">Истекли</div>
          <div className="mt-1 text-2xl font-bold text-loko-text-muted">{expired}</div>
        </div>
        <div className="metric-card">
          <div className="text-sm text-loko-text-secondary">Отменено</div>
          <div className="mt-1 text-2xl font-bold text-loko-danger">{cancelled}</div>
        </div>
      </div>

      {loading && <div className="py-12 text-center text-sm text-loko-text-muted">Загрузка…</div>}

      {filtered.length === 0 && !loading && (
        <div className="card p-12 text-center">
          <div className="text-lg font-semibold text-loko-text-primary">
            {search || statusFilter ? 'Ничего не найдено' : 'Пока нет купонов'}
          </div>
          <p className="mt-1 text-sm text-loko-text-secondary">
            {search || statusFilter ? 'Попробуйте изменить фильтр.' : 'Купоны появятся после первых выигрышей.'}
          </p>
        </div>
      )}

      {/* Счётчик */}
      {(search || statusFilter) && (
        <div className="mb-3 text-xs text-loko-text-muted">Показано {filtered.length} из {coupons.length}</div>
      )}

      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 border-b border-loko-bg-border px-4 py-3 text-[11px] uppercase tracking-wider text-loko-text-muted">
          <div className="col-span-2">Код</div>
          <div className="col-span-3">Клиент</div>
          <div className="col-span-3">Акция</div>
          <div className="col-span-1">Источник</div>
          <div className="col-span-1">Срок</div>
          <div className="col-span-1">Статус</div>
          <div className="col-span-1"></div>
        </div>
        {filtered.map(c => (
          <div key={c.id} className="flex flex-col gap-2 md:grid md:grid-cols-12 md:items-center md:gap-3 border-b border-loko-bg-border/40 px-4 py-3 last:border-b-0 hover:bg-loko-bg-elevated/30">
            <div className="md:col-span-2 font-mono text-xs text-loko-pink">{c.code}</div>
            <div className="md:col-span-3 min-w-0">
              <div className="truncate text-loko-text-primary">{c.user_name || '—'}</div>
              <div className="text-xs text-loko-text-muted">{c.user_phone || '—'}</div>
            </div>
            <div className="md:col-span-3 min-w-0">
              <div className="truncate text-sm font-semibold md:text-sm md:font-normal text-loko-text-primary">{c.offer_title}</div>
              <div className="text-xs text-loko-text-muted">{c.organization_name}</div>
            </div>
            <div className="md:col-span-1 text-xs text-loko-text-muted">{c.source_point || '—'}</div>
            <div className="md:col-span-1 text-xs text-loko-text-muted">
              <div className="inline-flex items-center gap-1"><IconClock size={10} />{new Date(c.expires_at).toLocaleDateString('ru')}</div>
            </div>
            <div className="md:col-span-1">
              <span className={`badge ${
                c.status === 'redeemed' ? 'badge-success' :
                c.status === 'issued' ? 'badge-pink' :
                c.status === 'cancelled' ? 'badge-danger' :
                'badge-neutral'
              }`}>
                {c.status === 'redeemed' ? 'погашён' :
                 c.status === 'issued' ? 'выдан' :
                 c.status === 'cancelled' ? 'отменён' :
                 'истёк'}
              </span>
            </div>
            <div className="md:col-span-1 text-right">
              {c.status === 'issued' && (
                <button
                  onClick={() => handleCancel(c.id)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-loko-danger hover:bg-loko-danger/10 transition-colors"
                  title="Отменить купон"
                >
                  <IconClose size={12} />Отмена
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
