import { useEffect, useState } from 'react'
import { screensApi, organizationsApi } from '@/lib/api'
import { IconSearch, IconMonitor, IconPlus, IconCalendar, IconClose, IconTrash } from '@/components/ui/icons'

export function AdminMonitors() {
  const [screens, setScreens] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orgFilter, setOrgFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '', organization_id: '', point: '', content: '', status: 'active',
    starts_at: '', ends_at: '',
  })
  const [saving, setSaving] = useState(false)

  const reload = () => {
    setLoading(true)
    Promise.all([screensApi.list(), organizationsApi.list()])
      .then(([scr, orgsList]) => { setScreens(scr); setOrgs(orgsList) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  const handleCreate = async () => {
    if (!form.name || !form.organization_id) return
    setSaving(true)
    try {
      await screensApi.create({
        ...form,
        starts_at: form.starts_at || undefined,
        ends_at: form.ends_at || undefined,
      })
      setShowCreate(false)
      setForm({ name: '', organization_id: '', point: '', content: '', status: 'active', starts_at: '', ends_at: '' })
      reload()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить монитор?')) return
    try {
      await screensApi.delete(id)
      reload()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Фильтрация
  const filtered = screens.filter(s => {
    if (orgFilter && s.organization_id !== orgFilter) return false
    if (search && !s.name?.toLowerCase().includes(search.toLowerCase()) && !s.point?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

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
          <div className="flex items-center gap-2 rounded-xl border border-loko-bg-border bg-loko-bg-surface/50 px-3 py-2 text-sm text-loko-text-muted md:w-56">
            <IconSearch size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск монитора…"
              className="w-full bg-transparent text-loko-text-primary placeholder:text-loko-text-muted focus:outline-none"
            />
          </div>
          <select
            value={orgFilter}
            onChange={e => setOrgFilter(e.target.value)}
            className="input w-auto"
          >
            <option value="">Все организации</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <button onClick={() => setShowCreate(true)} className="btn-brand"><IconPlus size={16} />Новый монитор</button>
        </div>
      </div>

      {/* Модалка создания монитора */}
      {showCreate && (
        <div className="card mb-4 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-loko-text-primary">Новый монитор</h3>
            <button onClick={() => setShowCreate(false)} className="text-loko-text-muted hover:text-loko-text-primary"><IconClose size={18} /></button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Название *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input w-full" placeholder="Экран у входа" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Организация *</label>
              <select value={form.organization_id} onChange={e => setForm(p => ({ ...p, organization_id: e.target.value }))} className="input w-full">
                <option value="">Выберите…</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Точка размещения</label>
              <input value={form.point} onChange={e => setForm(p => ({ ...p, point: e.target.value }))} className="input w-full" placeholder="Главный зал" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Контент</label>
              <input value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} className="input w-full" placeholder="Промо-ролик акции" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Дата начала</label>
              <input type="date" value={form.starts_at} onChange={e => setForm(p => ({ ...p, starts_at: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Дата окончания</label>
              <input type="date" value={form.ends_at} onChange={e => setForm(p => ({ ...p, ends_at: e.target.value }))} className="input w-full" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} disabled={saving} className="btn-brand disabled:opacity-50">
              {saving ? 'Создание…' : 'Создать'}
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost">Отмена</button>
          </div>
        </div>
      )}

      {/* Счётчик */}
      <div className="mb-3 text-xs text-loko-text-muted">
        Показано {filtered.length} из {screens.length}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-lg font-semibold text-loko-text-primary">
            {orgFilter || search ? 'Ничего не найдено' : 'Пока нет мониторов'}
          </div>
          <p className="mt-1 text-sm text-loko-text-secondary">
            {orgFilter || search ? 'Попробуйте изменить фильтр.' : 'Создайте первый монитор для организации.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s: any) => (
          <div key={s.id} className="card overflow-hidden">
            <div className="relative h-32 bg-gradient-to-br from-loko-bg-elevated to-loko-bg-base">
              <div className="absolute inset-3 rounded-2xl border border-loko-bg-border bg-loko-bg-base/40 p-3">
                <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">{s.organization_name || 'Без организации'}</div>
                <div className="mt-1 text-sm font-semibold text-loko-text-primary">{s.content || s.name}</div>
                <div className="mt-2 h-12 rounded-lg bg-gradient-brand" />
              </div>
              <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-loko-bg-base/70 text-loko-pink">
                <IconMonitor size={16} />
              </div>
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-loko-text-primary">{s.name} <span className="text-xs text-loko-text-muted">· {s.point}</span></div>
                <button onClick={() => handleDelete(s.id)} className="text-loko-text-muted hover:text-loko-danger" aria-label="Удалить">
                  <IconTrash size={14} />
                </button>
              </div>
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
