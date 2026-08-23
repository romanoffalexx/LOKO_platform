import { useEffect, useState } from 'react'
import { notificationsApi } from '@/lib/api'
import { IconMail, IconBell, IconShield } from '@/components/ui/icons'

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    notificationsApi.list()
      .then(setNotifications)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-loko-text-muted">Загрузка…</div>
  if (error) return <div className="text-sm text-red-400">{error}</div>

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Уведомления</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Каналы MAX и e-mail для партнёров и системных событий.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-success">MAX · подключён</span>
          <span className="badge badge-success">E-mail · подключён</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-white">MAX</div>
            <div>
              <div className="text-sm font-semibold text-loko-text-primary">MAX-канал</div>
              <div className="text-xs text-loko-text-muted">Партнёрам о выигрышах</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loko-violet text-white"><IconMail size={18} /></div>
            <div>
              <div className="text-sm font-semibold text-loko-text-primary">E-mail</div>
              <div className="text-xs text-loko-text-muted">Системные события + резерв</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loko-bg-elevated text-loko-text-muted"><IconBell size={18} /></div>
            <div>
              <div className="text-sm font-semibold text-loko-text-primary">SMS</div>
              <div className="text-xs text-loko-text-muted">Не используется в MVP</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 card overflow-hidden">
        <div className="border-b border-loko-bg-border px-4 py-3 text-sm font-semibold text-loko-text-primary">Лента уведомлений</div>
        <div className="grid grid-cols-12 gap-3 border-b border-loko-bg-border/60 px-4 py-2 text-[10px] uppercase tracking-wider text-loko-text-muted">
          <div className="col-span-2">Канал</div>
          <div className="col-span-4">Событие</div>
          <div className="col-span-3">Получатель</div>
          <div className="col-span-2">Время</div>
          <div className="col-span-1">Статус</div>
        </div>
        {notifications.map((n: any) => (
          <div key={n.id} className="grid grid-cols-12 items-center gap-3 border-b border-loko-bg-border/40 px-4 py-3 text-sm last:border-b-0">
            <div className="col-span-2">
              <span className={`badge ${n.channel === 'max' ? 'badge-pink' : 'badge-violet'}`}>{n.channel.toUpperCase()}</span>
            </div>
            <div className="col-span-4 text-loko-text-primary">{n.event}</div>
            <div className="col-span-3 text-xs text-loko-text-secondary">{n.recipient}</div>
            <div className="col-span-2 text-xs text-loko-text-muted">{new Date(n.created_at).toLocaleString('ru')}</div>
            <div className="col-span-1">
              <span className={`badge ${n.status === 'delivered' ? 'badge-success' : n.status === 'pending' ? 'badge-warn' : 'badge-danger'}`}>
                {n.status === 'delivered' ? 'ok' : n.status === 'pending' ? '...' : '!'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 card flex items-center gap-3 border-loko-pink/30 bg-loko-pink/5 p-4 text-sm text-loko-text-secondary">
        <IconShield size={18} className="text-loko-pink" />
        <span>Интеграция каналов абстрагирована — MAX/e-mail можно менять без правок бизнес-логики.</span>
      </div>
    </div>
  )
}
