import { useEffect, useState } from 'react'
import { participantsApi } from '@/lib/api'
import { toCsv, downloadCsv } from '@/lib/csv'
import { IconSearch, IconFilter, IconPlus, IconShield, IconCheck, IconDownload } from '@/components/ui/icons'

export function AdminParticipants() {
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'redeemed'>('all')

  useEffect(() => {
    participantsApi.list()
      .then(setParticipants)
      .catch(err => console.error('[Participants]', err))
      .finally(() => setLoading(false))
  }, [])

  // Поиск по имени/телефону
  let filtered = search
    ? participants.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.includes(search)
      )
    : participants

  // Табы-фильтры (если есть соответствующие поля)
  if (filter !== 'all') {
    filtered = filtered.filter(p =>
      filter === 'new' ? !p.contacted && !p.redeemed :
      filter === 'contacted' ? p.contacted && !p.redeemed :
      p.redeemed
    )
  }

  const handleExport = () => {
    const csv = toCsv(filtered, [
      { key: 'name', label: 'Имя' },
      { key: 'phone', label: 'Телефон' },
      { key: 'source', label: 'Источник' },
      { key: 'total_participations', label: 'Участий' },
      { key: 'total_wins', label: 'Выигрышей' },
      { key: 'pdn_consent', label: 'ПДн' },
      { key: 'marketing_consent', label: 'Маркетинг' },
      { key: 'created_at', label: 'Регистрация' },
    ])
    downloadCsv(csv, `participants_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Участники</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Единая клиентская база. Доступ только внутренней команде.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-loko-bg-border bg-loko-bg-surface/50 px-3 py-2 text-sm text-loko-text-muted md:w-64">
            <IconSearch size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Имя или телефон…"
              className="w-full bg-transparent text-loko-text-primary placeholder:text-loko-text-muted focus:outline-none"
            />
          </div>
          <button onClick={handleExport} className="btn-ghost" disabled={filtered.length === 0}><IconDownload size={16} />Экспорт CSV</button>
        </div>
      </div>

      {/* Фильтры-табы */}
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

      {/* Счётчик */}
      {!loading && (
        <div className="mb-2 text-xs text-loko-text-muted">
          Показано {filtered.length} из {participants.length}
        </div>
      )}

      {loading && <div className="py-12 text-center text-sm text-loko-text-muted">Загрузка…</div>}

      {!loading && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-lg font-semibold text-loko-text-primary">
            {search ? 'Ничего не найдено' : 'Пока нет участников'}
          </div>
          <p className="mt-1 text-sm text-loko-text-secondary">
            {search ? 'Попробуйте изменить запрос.' : 'Участники появятся после первых регистраций.'}
          </p>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 border-b border-loko-bg-border px-4 py-3 text-[11px] uppercase tracking-wider text-loko-text-muted">
          <div className="col-span-4">Имя / телефон</div>
          <div className="col-span-2">Источник</div>
          <div className="col-span-1 text-center">Участий</div>
          <div className="col-span-1 text-center">Выигрышей</div>
          <div className="col-span-2">Согласие ПДн</div>
          <div className="col-span-2">Зарегистрирован</div>
        </div>
        <div>
          {filtered.map(p => (
            <div key={p.id} className="flex flex-col gap-2 md:grid md:grid-cols-12 md:items-center md:gap-3 border-b border-loko-bg-border/60 px-4 py-3 last:border-b-0 hover:bg-loko-bg-elevated/30">
              <div className="md:col-span-4 min-w-0">
                <div className="truncate text-sm font-semibold text-loko-text-primary">{p.name}</div>
                <div className="text-xs text-loko-text-muted">{p.phone}</div>
              </div>
              <div className="md:col-span-2 text-sm text-loko-text-secondary">{p.source || '—'}</div>
              <div className="flex items-center gap-3 md:contents">
                <div className="md:col-span-1 text-center text-sm">
                  <span className="md:hidden text-xs text-loko-text-muted mr-1">Участий:</span>
                  <span className="font-semibold text-loko-text-primary">{p.total_participations}</span>
                </div>
                <div className="md:col-span-1 text-center text-sm">
                  <span className="md:hidden text-xs text-loko-text-muted mr-1">Выигр.:</span>
                  <span className="font-semibold text-loko-pink">{p.total_wins}</span>
                </div>
              </div>
              <div className="md:col-span-2 flex items-center gap-2 text-xs">
                <span className="badge badge-success gap-1.5"><IconCheck size={10} />ПДн</span>
                {p.marketing_consent ? (
                  <span className="badge badge-violet">маркетинг</span>
                ) : (
                  <span className="badge badge-neutral">—</span>
                )}
              </div>
              <div className="md:col-span-2 text-xs text-loko-text-muted">{new Date(p.created_at).toLocaleDateString('ru')}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 card flex items-center gap-3 border-loko-pink/30 bg-loko-pink/5 p-4 text-sm text-loko-text-secondary">
        <IconShield size={18} className="text-loko-pink" />
        <span>Доступ к базе участников — только внутренней команде. Партнёры видят только свои лиды.</span>
      </div>
    </div>
  )
}
