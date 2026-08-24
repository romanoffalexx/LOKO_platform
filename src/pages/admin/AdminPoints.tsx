import { useEffect, useState } from 'react'
import { pointsApi, organizationsApi } from '@/lib/api'
import { IconPlus, IconSearch, IconPin, IconTablet, IconTrash, IconEdit, IconClose } from '@/components/ui/icons'

export function AdminPoints() {
  const [points, setPoints] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', address: '', phone: '', contact_name: '', email: '', working_hours: '', is_active: true })
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    organization_id: '', name: '', address: '', phone: '', contact_name: '', email: '', working_hours: '09:00-21:00', has_tablet: false,
  })

  const load = () => {
    setLoading(true)
    Promise.all([pointsApi.list(), organizationsApi.list()])
      .then(([p, o]) => { setPoints(p); setOrgs(o) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openEdit = (p: any) => {
    setEditingId(p.id)
    setEditForm({ name: p.name, address: p.address, phone: p.phone || '', contact_name: p.contact_name || '', email: p.email || '', working_hours: p.working_hours || '09:00-21:00', is_active: p.is_active })
    setShowForm(false)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setSaving(true)
    try {
      await pointsApi.update(editingId, editForm)
      setEditingId(null)
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (p: any) => {
    try {
      await pointsApi.update(p.id, { is_active: !p.is_active })
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await pointsApi.create(form)
      setShowForm(false)
      setForm({ organization_id: '', name: '', address: '', phone: '', contact_name: '', email: '', working_hours: '09:00-21:00', has_tablet: false })
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить точку?')) return
    try {
      await pointsApi.delete(id)
      load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return <div className="text-sm text-loko-text-muted">Загрузка...</div>

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Точки партнёров</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Места размещения планшетов для розыгрышей.</p>
        </div>
        <button className="btn-brand" onClick={() => setShowForm(!showForm)}>
          <IconPlus size={16} />Добавить точку
        </button>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 p-5 space-y-4">
          <h3 className="text-base font-semibold text-loko-text-primary">Новая точка</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Организация *</label>
              <select
                value={form.organization_id}
                onChange={e => setForm({ ...form, organization_id: e.target.value })}
                className="input w-full" required
              >
                <option value="">Выберите...</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Название точки *</label>
              <input className="input w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="ТРЦ Северный" />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Адрес *</label>
              <input className="input w-full" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Телефон</label>
              <input className="input w-full" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Контактное имя</label>
              <input className="input w-full" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Email</label>
              <input type="email" className="input w-full" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Часы работы</label>
              <input className="input w-full" value={form.working_hours} onChange={e => setForm({ ...form, working_hours: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <input type="checkbox" id="has_tablet" checked={form.has_tablet} onChange={e => setForm({ ...form, has_tablet: e.target.checked })} className="h-4 w-4" />
              <label htmlFor="has_tablet" className="text-sm text-loko-text-primary">Есть планшет (автосоздание логина/пароля)</label>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-brand">Создать</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Отмена</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {points.map(p => (
          <div key={p.id} className="card p-5">
            {editingId === p.id ? (
              <form onSubmit={handleEdit} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-loko-text-primary">Редактирование</h3>
                  <button type="button" onClick={() => setEditingId(null)} className="text-loko-text-muted hover:text-loko-text-primary"><IconClose size={16} /></button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <input className="input w-full" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required placeholder="Название" />
                  <input className="input w-full" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} required placeholder="Адрес" />
                  <input className="input w-full" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="Телефон" />
                  <input className="input w-full" value={editForm.contact_name} onChange={e => setEditForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Контакт" />
                  <input className="input w-full" value={editForm.working_hours} onChange={e => setEditForm(f => ({ ...f, working_hours: e.target.value }))} placeholder="Часы" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-brand text-xs disabled:opacity-50">{saving ? '…' : 'Сохранить'}</button>
                  <button type="button" onClick={() => setEditingId(null)} className="btn-ghost text-xs">Отмена</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loko-bg-base/60 text-loko-pink">
                      <IconPin size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-loko-text-primary">{p.name}</div>
                      <div className="text-xs text-loko-text-muted">{p.org_name} · {p.address}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(p)} className="text-loko-text-muted hover:text-loko-pink"><IconEdit size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="text-loko-text-muted hover:text-red-400"><IconTrash size={14} /></button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-loko-text-secondary">
                  {p.phone && <div>Тел: {p.phone}</div>}
                  {p.contact_name && <div>Контакт: {p.contact_name}</div>}
                  {p.email && <div>Email: {p.email}</div>}
                  <div>Часы: {p.working_hours}</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => handleToggleActive(p)} className={`badge cursor-pointer ${p.is_active ? 'badge-success' : 'badge-neutral'}`}>
                    {p.is_active ? 'Активна' : 'Неактивна'}
                  </button>
                  {p.has_tablet && <span className="badge badge-pink"><IconTablet size={10} className="mr-1" />Планшет</span>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {points.length === 0 && !loading && (
        <div className="card p-12 text-center">
          <div className="text-lg font-semibold text-loko-text-primary">Нет точек</div>
          <p className="mt-1 text-sm text-loko-text-secondary">Добавьте первую точку партнёра.</p>
        </div>
      )}
    </div>
  )
}
