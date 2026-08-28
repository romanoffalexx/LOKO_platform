import { useEffect, useState } from 'react'
import { pointsApi, organizationsApi, tabletsApi } from '@/lib/api'
import { copyToClipboard } from '@/lib/clipboard'
import { YandexPointsMap } from '@/components/YandexPointsMap'
import { IconPlus, IconPin, IconTablet, IconTrash, IconEdit, IconClose } from '@/components/ui/icons'
import { ZoneSelect } from '@/components/ui/ZoneSelect'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

function genPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let pwd = ''
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

export function AdminPoints() {
  const [points, setPoints] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', address: '', phone: '', contact_name: '', email: '', working_hours: '', is_active: true, zone: '' })
  const [saving, setSaving] = useState(false)
  const [tablets, setTablets] = useState<any[]>([])
  const [expandedPointId, setExpandedPointId] = useState<string | null>(null)
  const [tabletEdit, setTabletEdit] = useState<{ id: string; login: string; password: string; showPwd: boolean } | null>(null)
  const [savingTablet, setSavingTablet] = useState(false)
  const [createdTabletInfo, setCreatedTabletInfo] = useState<{ pointName: string; login: string; password: string } | null>(null)
  const [form, setForm] = useState({
    organization_id: '', name: '', address: '', phone: '', contact_name: '', email: '', working_hours: '09:00-21:00', has_tablet: false, zone: '',
  })
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'point' | 'tablet'; id: string; name: string } | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([pointsApi.list(), organizationsApi.list(), tabletsApi.list()])
      .then(([p, o, t]) => { setPoints(p); setOrgs(o); setTablets(t) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openEdit = (p: any) => {
    setEditingId(p.id)
    setEditForm({ name: p.name, address: p.address, phone: p.phone || '', contact_name: p.contact_name || '', email: p.email || '', working_hours: p.working_hours || '09:00-21:00', is_active: p.is_active, zone: p.zone || '' })
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
      const result = await pointsApi.create(form)
      setShowForm(false)
      const pointName = form.name
      setForm({ organization_id: '', name: '', address: '', phone: '', contact_name: '', email: '', working_hours: '09:00-21:00', has_tablet: false, zone: '' })
      load()
      // Если создан планшет — показываем попап с логином/паролем
      if (result.tablet) {
        setCreatedTabletInfo({ pointName, login: result.tablet.login, password: result.tablet.password })
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const openTabletEdit = (t: any) => {
    setTabletEdit({ id: t.id, login: t.login || '', password: t.password_plain || '', showPwd: true })
  }

  const handleSaveTablet = async () => {
    if (!tabletEdit) return
    setSavingTablet(true)
    try {
      const orig = tablets.find(t => t.id === tabletEdit.id)
      const payload: Record<string, any> = { name: orig?.name }
      if (tabletEdit.password && tabletEdit.password !== (orig?.password_plain || '')) payload.new_password = tabletEdit.password
      await tabletsApi.update(tabletEdit.id, payload)
      setTabletEdit(null)
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingTablet(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    try {
      if (confirmDelete.type === 'point') {
        await pointsApi.delete(confirmDelete.id)
      } else {
        await tabletsApi.delete(confirmDelete.id)
        setExpandedPointId(null)
      }
      setConfirmDelete(null)
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

      {/* Яндекс.Карта со всеми точками */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-loko-bg-border" style={{ height: 400 }}>
        <YandexPointsMap points={points} />
      </div>

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
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Зона</label>
              <ZoneSelect value={form.zone} onChange={v => setForm({ ...form, zone: v })} />
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
        {points.map(p => {
          const pointTablets = tablets.filter(t => t.point_id === p.id)
          const isExpanded = expandedPointId === p.id
          return (
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
                  <ZoneSelect value={editForm.zone} onChange={v => setEditForm(f => ({ ...f, zone: v }))} />
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
                    <button onClick={() => setConfirmDelete({ type: 'point', id: p.id, name: p.name })} className="text-loko-text-muted hover:text-red-400"><IconTrash size={14} /></button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-loko-text-secondary">
                  {p.phone && <div>Тел: {p.phone}</div>}
                  {p.contact_name && <div>Контакт: {p.contact_name}</div>}
                  {p.email && <div>Email: {p.email}</div>}
                  <div>Часы: {p.working_hours}</div>
                  {p.zone && <div>Зона: {p.zone}</div>}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => handleToggleActive(p)} className={`badge cursor-pointer ${p.is_active ? 'badge-success' : 'badge-neutral'}`}>
                    {p.is_active ? 'Активна' : 'Неактивна'}
                  </button>
                  {p.has_tablet && (
                    <button
                      onClick={() => setExpandedPointId(isExpanded ? null : p.id)}
                      className="badge badge-pink cursor-pointer"
                      title="Показать планшет"
                    >
                      <IconTablet size={10} className="mr-1" />Планшет
                    </button>
                  )}
                </div>

                {/* Раскрытый планшет в режиме редактирования */}
                {isExpanded && (
                  <div className="mt-3 rounded-xl border border-loko-bg-border bg-loko-bg-base/40 p-3 space-y-2">
                    {pointTablets.length === 0 && (
                      <div className="text-xs text-loko-text-muted">Планшет ещё не создан.</div>
                    )}
                    {pointTablets.map(t => (
                      <div key={t.id} className="space-y-2">
                        {tabletEdit && tabletEdit.id === t.id ? (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[10px] text-loko-text-muted mb-1">Логин</label>
                              <div className="flex items-center gap-2">
                                <input value={tabletEdit.login} readOnly className="input w-full font-mono text-xs" />
                                <button onClick={() => copyToClipboard(tabletEdit.login)} className="btn-ghost px-2" title="Копировать">📋</button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-loko-text-muted mb-1">Пароль</label>
                              <div className="flex items-center gap-2">
                                <input type={tabletEdit.showPwd ? 'text' : 'password'} value={tabletEdit.password} onChange={e => setTabletEdit(s => s ? { ...s, password: e.target.value } : s)} className="input w-full font-mono text-xs" />
                                <button onClick={() => setTabletEdit(s => s ? { ...s, showPwd: !s.showPwd } : s)} className="btn-ghost px-2">{tabletEdit.showPwd ? '🙈' : '👁️'}</button>
                                <button onClick={() => setTabletEdit(s => s ? { ...s, password: genPassword(), showPwd: true } : s)} className="btn-ghost px-2">🎲</button>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={handleSaveTablet} disabled={savingTablet} className="btn-brand text-xs disabled:opacity-50">{savingTablet ? '…' : 'Сохранить'}</button>
                              <button onClick={() => setTabletEdit(null)} className="btn-ghost text-xs">Отмена</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-loko-pink/10 text-loko-pink"><IconTablet size={16} /></div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-loko-text-primary">{t.name}</div>
                              <div className="font-mono text-[10px] text-loko-pink">{t.login} · {t.password_plain || 'пароль не задан'}</div>
                            </div>
                            <button onClick={() => openTabletEdit(t)} className="text-loko-text-muted hover:text-loko-violet" title="Редактировать"><IconEdit size={14} /></button>
                            <button onClick={() => setConfirmDelete({ type: 'tablet', id: t.id, name: t.name })} className="text-loko-text-muted hover:text-red-400" title="Удалить"><IconTrash size={14} /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          )
        })}
      </div>

      {points.length === 0 && !loading && (
        <div className="card p-12 text-center">
          <div className="text-lg font-semibold text-loko-text-primary">Нет точек</div>
          <p className="mt-1 text-sm text-loko-text-secondary">Добавьте первую точку партнёра.</p>
        </div>
      )}

      {/* Попап с данными созданного планшета */}
      {createdTabletInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCreatedTabletInfo(null)}>
          <div className="card mx-4 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-loko-pink/10 text-loko-pink">
                <IconTablet size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-loko-text-primary">Планшет создан</h3>
                <p className="text-sm text-loko-text-muted">{createdTabletInfo.pointName}</p>
              </div>
              <button onClick={() => setCreatedTabletInfo(null)} className="ml-auto text-loko-text-muted hover:text-loko-text-primary"><IconClose size={18} /></button>
            </div>

            <div className="rounded-xl border border-loko-bg-border bg-loko-bg-base/50 p-4 space-y-2">
              <div className="text-xs font-medium uppercase tracking-wider text-loko-text-muted">Данные для входа</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-loko-text-secondary">Логин:</span>
                <code className="text-sm font-semibold text-loko-text-primary">{createdTabletInfo.login}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-loko-text-secondary">Пароль:</span>
                <code className="text-sm font-semibold text-loko-text-primary">{createdTabletInfo.password}</code>
              </div>
              <button onClick={() => copyToClipboard(`Логин: ${createdTabletInfo.login}\nПароль: ${createdTabletInfo.password}`)} className="btn-ghost w-full text-xs">
                Скопировать данные
              </button>
            </div>

            <button onClick={() => setCreatedTabletInfo(null)} className="btn-brand w-full">Готово</button>
          </div>
        </div>
      )}

      {/* Подтверждение удаления точки/планшета */}
      <ConfirmDialog
        open={!!confirmDelete}
        message={confirmDelete ? `${confirmDelete.type === 'point' ? 'Точка' : 'Планшет'} «${confirmDelete.name}» будет удален(а) безвозвратно.` : ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
