import { useEffect, useState } from 'react'
import { tabletsApi } from '@/lib/api'
import { IconSearch, IconFilter, IconTablet, IconRefresh } from '@/components/ui/icons'

export function AdminTablets() {
  const [tablets, setTablets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const data = await tabletsApi.list()
      setTablets(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="text-sm text-loko-text-muted">Загрузка…</div>
  if (error) return <div className="text-sm text-red-400">{error}</div>

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Планшеты</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Устройства, heartbeat, версия приложения.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-loko-bg-border bg-loko-bg-surface/50 px-3 py-2 text-sm text-loko-text-muted md:w-64">
            <IconSearch size={16} />
            <input placeholder="Поиск по SN…" className="w-full bg-transparent text-loko-text-primary placeholder:text-loko-text-muted focus:outline-none" />
          </div>
          <button className="btn-ghost" onClick={load}><IconRefresh size={16} /></button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 border-b border-loko-bg-border px-4 py-3 text-[11px] uppercase tracking-wider text-loko-text-muted">
          <div className="col-span-2">Имя</div>
          <div className="col-span-2">SN</div>
          <div className="col-span-3">Организация</div>
          <div className="col-span-2">Точка</div>
          <div className="col-span-1">Версия</div>
          <div className="col-span-1">Last seen</div>
          <div className="col-span-1">Статус</div>
        </div>
        {tablets.map((t: any) => (
          <div key={t.id} className="flex flex-col gap-1.5 md:grid md:grid-cols-12 md:items-center md:gap-3 border-b border-loko-bg-border/40 px-4 py-3 text-sm last:border-b-0">
            <div className="md:col-span-2 inline-flex items-center gap-2 font-semibold text-loko-text-primary">
              <IconTablet size={14} className="text-loko-pink" />{t.name}
            </div>
            <div className="md:col-span-2 font-mono text-xs text-loko-text-muted">{t.serial}</div>
            <div className="md:col-span-3 truncate text-loko-text-secondary">{t.organization_name}</div>
            <div className="md:col-span-2 text-xs text-loko-text-muted">{t.point}</div>
            <div className="flex items-center gap-3 md:contents">
              <div className="md:col-span-1 text-xs text-loko-text-muted">v{t.app_version}</div>
              <div className="md:col-span-1 text-xs text-loko-text-muted">{new Date(t.last_seen).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div className="md:col-span-1">
              <span className={`badge ${t.status === 'online' ? 'badge-success' : t.status === 'offline' ? 'badge-neutral' : 'badge-warn'}`}>
                {t.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
