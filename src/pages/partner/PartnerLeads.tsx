import { useEffect, useState } from 'react'
import { leadsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { IconSearch, IconPhone, IconCheck, IconFilter, IconShield } from '@/components/ui/icons'

export function PartnerLeads() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'redeemed'>('all')

  useEffect(() => {
    leadsApi.list()
      .then(data => {
        // Фильтруем лиды только по организации партнёра
        if (user?.organization_id) {
          setLeads(data.filter(l => l.organization_id === user.organization_id))
        } else {
          setLeads([])
        }
      })
      .catch(err => console.error('[Leads]', err))
      .finally(() => setLoading(false))
  }, [user])

  const filtered = filter === 'all' ? leads : leads.filter(l =>
    filter === 'new' ? !l.contacted :
    filter === 'contacted' ? l.contacted && !l.redeemed :
    l.redeemed
  )

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Лиды</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Имя, телефон, акция, источник. Только по вашим акциям.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-loko-bg-border bg-loko-bg-surface/50 px-3 py-2 text-sm text-loko-text-muted md:w-64">
            <IconSearch size={16} />
            <input placeholder="Поиск клиента…" className="w-full bg-transparent text-loko-text-primary placeholder:text-loko-text-muted focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1 rounded-xl border border-loko-bg-border bg-loko-bg-base/40 p-1 text-sm w-fit">
        {[
          { id: 'all', label: 'Все' },
          { id: 'new', label: 'Новые' },
          { id: 'contacted', label: 'На связи' },
          { id: 'redeemed', label: 'Погасили' },
        ].map(t => (
          <button key={t.id} onClick={() => setFilter(t.id as any)} className={`rounded-lg px-3 py-1.5 ${filter === t.id ? 'bg-loko-bg-elevated text-loko-text-primary' : 'text-loko-text-secondary'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="py-12 text-center text-sm text-loko-text-muted">Загрузка…</div>}

      {!loading && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-lg font-semibold text-loko-text-primary">Пока нет лидов</div>
          <p className="mt-1 text-sm text-loko-text-secondary">Лиды появятся после первых выигрышей.</p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b border-loko-bg-border px-4 py-3 text-[11px] uppercase tracking-wider text-loko-text-muted">
          <div className="col-span-3">Клиент</div>
          <div className="col-span-2">Телефон</div>
          <div className="col-span-3">Акция</div>
          <div className="col-span-2">Источник</div>
          <div className="col-span-1">Когда</div>
          <div className="col-span-1 text-right">Действия</div>
        </div>
        {filtered.map(l => (
          <div key={l.id} className="grid grid-cols-12 items-center gap-3 border-b border-loko-bg-border/40 px-4 py-3 text-sm last:border-b-0">
            <div className="col-span-3">
              <div className="text-sm font-semibold text-loko-text-primary">{l.client_name}</div>
              <div className="text-xs text-loko-text-muted">{l.client_phone}</div>
            </div>
            <div className="col-span-2 text-xs text-loko-text-secondary">{l.client_phone}</div>
            <div className="col-span-3 text-sm text-loko-text-primary">{l.offer_title}</div>
            <div className="col-span-2 text-xs text-loko-text-muted">{l.source_tablet || '—'} · {l.source_point || '—'}</div>
            <div className="col-span-1 text-xs text-loko-text-muted">{new Date(l.created_at).toLocaleDateString('ru')}</div>
            <div className="col-span-1 flex items-center justify-end gap-1.5">
              <a href={`tel:${l.client_phone.replace(/\D/g, '')}`} className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand text-white" title="Позвонить">
                <IconPhone size={14} />
              </a>
              {l.redeemed && <span className="badge badge-success"><IconCheck size={10} /></span>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 card flex items-center gap-3 border-loko-pink/30 bg-loko-pink/5 p-4 text-sm text-loko-text-secondary">
        <IconShield size={18} className="text-loko-pink" />
        <span>Вы видите только лиды по своим акциям. Доступа к общей клиентской базе нет.</span>
      </div>
    </div>
  )
}
