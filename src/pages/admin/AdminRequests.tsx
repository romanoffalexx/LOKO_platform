import { useEffect, useState } from 'react'
import { ticketsApi } from '@/lib/api'
import { IconInbox, IconCheck } from '@/components/ui/icons'

export function AdminRequests() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const load = () => {
    setLoading(true)
    ticketsApi.list()
      .then(setTickets)
      .catch(err => console.error('[Tickets]', err))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await ticketsApi.updateStatus(id, status)
      load()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)
  const counts = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  }

  const statusLabel: Record<string, string> = {
    open: 'Новая',
    in_progress: 'В работе',
    resolved: 'Решена',
    closed: 'Закрыта',
  }

  const statusBadge: Record<string, string> = {
    open: 'badge-pink',
    in_progress: 'badge-violet',
    resolved: 'badge-success',
    closed: 'badge-neutral',
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Заявки партнёров</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Обращения от партнёров: новые акции, тех. вопросы, отключения.</p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-loko-bg-border bg-loko-bg-base/40 p-1 text-sm">
          <button className={`rounded-lg px-3 py-1.5 ${filter === 'all' ? 'bg-loko-bg-elevated text-loko-text-primary' : 'text-loko-text-secondary'}`} onClick={() => setFilter('all')}>Все</button>
          <button className={`rounded-lg px-3 py-1.5 ${filter === 'open' ? 'bg-loko-bg-elevated text-loko-text-primary' : 'text-loko-text-secondary'}`} onClick={() => setFilter('open')}>
            Новые <span className="ml-1 rounded bg-loko-pink/20 px-1.5 text-[10px] text-loko-pink">{counts.open}</span>
          </button>
          <button className={`rounded-lg px-3 py-1.5 ${filter === 'in_progress' ? 'bg-loko-bg-elevated text-loko-text-primary' : 'text-loko-text-secondary'}`} onClick={() => setFilter('in_progress')}>В работе</button>
          <button className={`rounded-lg px-3 py-1.5 ${filter === 'resolved' ? 'bg-loko-bg-elevated text-loko-text-primary' : 'text-loko-text-secondary'}`} onClick={() => setFilter('resolved')}>Решённые</button>
        </div>
      </div>

      {loading && <div className="text-sm text-loko-text-muted">Загрузка...</div>}

      <div className="flex flex-col gap-2">
        {filtered.map(t => (
          <div key={t.id} className="card p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loko-bg-base/60 text-loko-pink">
                <IconInbox size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-loko-text-primary">{t.org_name}</span>
                  <span className={`badge ${statusBadge[t.status] || 'badge-neutral'}`}>{statusLabel[t.status] || t.status}</span>
                </div>
                <div className="mt-1 text-sm font-medium text-loko-text-primary">{t.subject}</div>
                <div className="mt-1 text-sm text-loko-text-secondary">{t.message}</div>
                <div className="mt-2 text-xs text-loko-text-muted">{new Date(t.created_at).toLocaleString('ru')}</div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {t.status === 'open' && (
                  <>
                    <button onClick={() => handleStatusChange(t.id, 'in_progress')} className="btn-ghost px-3 py-1.5 text-xs">В работу</button>
                    <button onClick={() => handleStatusChange(t.id, 'resolved')} className="btn-ghost px-3 py-1.5 text-xs text-loko-success"><IconCheck size={14} />Решена</button>
                  </>
                )}
                {t.status === 'in_progress' && (
                  <button onClick={() => handleStatusChange(t.id, 'resolved')} className="btn-ghost px-3 py-1.5 text-xs text-loko-success"><IconCheck size={14} />Решена</button>
                )}
                {t.status === 'resolved' && (
                  <button onClick={() => handleStatusChange(t.id, 'closed')} className="btn-ghost px-3 py-1.5 text-xs">Закрыть</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-lg font-semibold text-loko-text-primary">Нет заявок</div>
          <p className="mt-1 text-sm text-loko-text-secondary">Все обращения обработаны.</p>
        </div>
      )}
    </div>
  )
}
