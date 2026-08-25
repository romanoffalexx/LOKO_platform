import { useEffect, useState } from 'react'
import { tabletsApi, pointsApi } from '@/lib/api'
import { copyToClipboard } from '@/lib/clipboard'
import { IconSearch, IconTablet, IconRefresh, IconClose, IconEdit } from '@/components/ui/icons'

function genPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let pwd = ''
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

export function AdminTablets() {
  const [tablets, setTablets] = useState<any[]>([])
  const [points, setPoints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', point_id: '', login: '', password: '' })
  const [saving, setSaving] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [origPassword, setOrigPassword] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const data = await tabletsApi.list()
      setTablets(data)
      setPoints(await pointsApi.list())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить планшет?')) return
    try {
      await tabletsApi.delete(id)
      setTablets(prev => prev.filter(t => t.id !== id))
    } catch (err) { console.error('[Tablet delete]', err) }
  }

  const openEdit = (t: any) => {
    setEditingId(t.id)
    const pwd = t.password_plain || ''
    setEditForm({ name: t.name || '', point_id: t.point_id || '', login: t.login || '', password: pwd })
    setOrigPassword(pwd)
    setShowPwd(false)
  }

  const handleSave = async () => {
    if (!editingId || !editForm.name || !editForm.point_id) return
    setSaving(true)
    try {
      const payload: Record<string, any> = { name: editForm.name, point_id: editForm.point_id }
      if (editForm.password && editForm.password !== origPassword) payload.new_password = editForm.password
      await tabletsApi.update(editingId, payload)
      setEditingId(null)
      await load()
    } catch (err) { console.error('[Tablet update]', err) }
    finally { setSaving(false) }
  }

  useEffect(() => { load() }, [])

  // Фильтрация
  const filtered = tablets.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!t.name?.toLowerCase().includes(q) &&
          !t.organization_name?.toLowerCase().includes(q) &&
          !t.point_name?.toLowerCase().includes(q) &&
          !t.point?.toLowerCase().includes(q) &&
          !t.login?.toLowerCase().includes(q)) return false
    }
    return true
  })

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
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Имя, организация, точка…"
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
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="issue">Issue</option>
          </select>
          <button className="btn-ghost" onClick={load}><IconRefresh size={16} /></button>
        </div>
      </div>

      {/* Счётчик */}
      {(search || statusFilter) && (
        <div className="mb-3 text-xs text-loko-text-muted">Показано {filtered.length} из {tablets.length}</div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="card p-12 text-center">
          <div className="text-lg font-semibold text-loko-text-primary">
            {search || statusFilter ? 'Ничего не найдено' : 'Пока нет планшетов'}
          </div>
          <p className="mt-1 text-sm text-loko-text-secondary">
            {search || statusFilter ? 'Попробуйте изменить фильтр.' : 'Планшеты появятся после создания точек.'}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 border-b border-loko-bg-border px-4 py-3 text-[11px] uppercase tracking-wider text-loko-text-muted">
            <div className="col-span-2">Имя</div>
            <div className="col-span-2">Логин</div>
            <div className="col-span-3">Организация</div>
            <div className="col-span-2">Точка</div>
            <div className="col-span-1">Версия</div>
            <div className="col-span-1">Last seen</div>
            <div className="col-span-1"></div>
          </div>
          {filtered.map((t: any) => (
          <div key={t.id}>
            {editingId === t.id ? (
              <div className="border-b border-loko-bg-border/40 px-4 py-3 space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <div>
                    <label className="block text-xs text-loko-text-muted mb-1">Название</label>
                    <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-loko-text-muted mb-1">Точка *</label>
                    <select value={editForm.point_id} onChange={e => setEditForm(p => ({ ...p, point_id: e.target.value }))} className="input w-full">
                      <option value="">— выберите точку —</option>
                      {points.map(p => {
                        const occupiedBy = tablets.find(x => x.point_id === p.id && x.id !== t.id)
                        return (
                          <option key={p.id} value={p.id} disabled={!!occupiedBy}>
                            {p.name}{p.organization_name ? ` (${p.organization_name})` : ''}{occupiedBy ? ` — планшет «${occupiedBy.name}»` : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-loko-text-muted mb-1">Зона (от точки)</label>
                    <input value={points.find(p => p.id === editForm.point_id)?.zone || '—'} readOnly className="input w-full opacity-60" title="Зона наследуется от точки" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-xs text-loko-text-muted mb-1">Логин</label>
                    <div className="flex items-center gap-2">
                      <input value={editForm.login} readOnly className="input w-full font-mono" />
                      <button onClick={() => copyToClipboard(editForm.login)} className="btn-ghost px-2" title="Скопировать логин">📋</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-loko-text-muted mb-1">Пароль</label>
                    <div className="flex items-center gap-2">
                      <input type={showPwd ? 'text' : 'password'} value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} className="input w-full font-mono" />
                      <button onClick={() => setShowPwd(s => !s)} className="btn-ghost px-2" title={showPwd ? 'Скрыть' : 'Показать'}>{showPwd ? '🙈' : '👁️'}</button>
                      <button onClick={() => { setEditForm(p => ({ ...p, password: genPassword() })); setShowPwd(true) }} className="btn-ghost px-2" title="Сгенерировать">🎲</button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving || !editForm.name} className="btn-brand disabled:opacity-50">{saving ? 'Сохранение…' : 'Сохранить'}</button>
                  <button onClick={() => setEditingId(null)} className="btn-ghost">Отмена</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 md:grid md:grid-cols-12 md:items-center md:gap-3 border-b border-loko-bg-border/40 px-4 py-3 text-sm last:border-b-0">
                <div className="md:col-span-2 inline-flex items-center gap-2 font-semibold text-loko-text-primary">
                  <IconTablet size={14} className="text-loko-pink" />{t.name}
                </div>
                <div className="md:col-span-2 font-mono text-xs text-loko-text-muted">{t.login && <div className="text-loko-pink">{t.login}</div>}{t.password_plain && <div className="text-loko-text-muted">••••••</div>}</div>
                <div className="md:col-span-3 truncate text-loko-text-secondary">{t.organization_name}</div>
                <div className="md:col-span-2 text-xs text-loko-text-muted">{t.point_name || t.point}{t.point_zone ? ` · ${t.point_zone}` : ''}</div>
                <div className="flex items-center gap-3 md:contents">
                  <div className="md:col-span-1 text-xs text-loko-text-muted">v{t.app_version}</div>
                  <div className="md:col-span-1 text-xs text-loko-text-muted">{t.last_seen ? new Date(t.last_seen).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
                  <div className="md:col-span-1 flex items-center gap-2">
                    <button onClick={() => openEdit(t)} className="text-loko-text-muted hover:text-loko-violet"><IconEdit size={16} /></button>
                    <button onClick={() => handleDelete(t.id)} className="text-loko-text-muted hover:text-loko-danger"><IconClose size={16} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
