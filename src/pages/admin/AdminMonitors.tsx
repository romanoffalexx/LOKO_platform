import { useEffect, useState } from 'react'
import { screensApi } from '@/lib/api'
import { IconSearch, IconFilter, IconMonitor, IconPlus, IconCalendar } from '@/components/ui/icons'

export function AdminMonitors() {
  const [screens, setScreens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    screensApi.list()
      .then(setScreens)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-loko-text-muted">Загрузка…</div>
  if (error) return <div className="text-sm text-red-400">{error}</div>

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Мониторы</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Контент на экранах точек, период размещения.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-loko-bg-border bg-loko-bg-surface/50 px-3 py-2 text-sm text-loko-text-muted md:w-64">
            <IconSearch size={16} />
            <input placeholder="Поиск монитора…" className="w-full bg-transparent text-loko-text-primary placeholder:text-loko-text-muted focus:outline-none" />
          </div>
          <button className="btn-ghost"><IconFilter size={16} /></button>
          <button className="btn-brand"><IconPlus size={16} />Новый монитор</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {screens.map((s: any) => (
          <div key={s.id} className="card overflow-hidden">
            <div className="relative h-32 bg-gradient-to-br from-loko-bg-elevated to-loko-bg-base">
              <div className="absolute inset-3 rounded-2xl border border-loko-bg-border bg-loko-bg-base/40 p-3">
                <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">{s.organization_name}</div>
                <div className="mt-1 text-sm font-semibold text-loko-text-primary">{s.content}</div>
                <div className="mt-2 h-12 rounded-lg bg-gradient-brand" />
              </div>
              <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-loko-bg-base/70 text-loko-pink">
                <IconMonitor size={16} />
              </div>
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-sm text-loko-text-primary">{s.name} <span className="text-xs text-loko-text-muted">· {s.point}</span></div>
              <div className="flex items-center gap-2 text-xs text-loko-text-muted">
                <IconCalendar size={12} />{(s.starts_at ?? '').slice(0, 10)} → {(s.ends_at ?? '').slice(0, 10)}
              </div>
              <span className={`badge ${s.status === 'active' ? 'badge-success' : s.status === 'paused' ? 'badge-warn' : 'badge-danger'}`}>
                {s.status === 'active' ? 'активен' : s.status === 'paused' ? 'пауза' : 'ошибка'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
