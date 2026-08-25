import { useEffect, useState } from 'react'
import { adminSettingsApi, zonesApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { IconShield, IconCheck, IconPlus, IconEdit, IconClose, IconPin } from '@/components/ui/icons'

export function AdminSettings() {
  const { user, refresh } = useAuth()
  const [settings, setSettings] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', telegram_chat_id: '', telegram_username: '' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // ── Справочник зон ──
  const [zones, setZones] = useState<any[]>([])
  const [newZone, setNewZone] = useState('')
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)
  const [zoneDraft, setZoneDraft] = useState('')
  const [zoneBusy, setZoneBusy] = useState(false)

  const loadZones = async () => {
    try { setZones(await zonesApi.list()) } catch (err) { console.error('[Zones]', err) }
  }

  const handleAddZone = async () => {
    const name = newZone.trim()
    if (!name) return
    setZoneBusy(true)
    try {
      await zonesApi.create({ name })
      setNewZone('')
      await loadZones()
    } catch (err: any) { alert(err.message) }
    finally { setZoneBusy(false) }
  }

  const handleRenameZone = async (id: string) => {
    const name = zoneDraft.trim()
    if (!name) return
    setZoneBusy(true)
    try {
      await zonesApi.update(id, { name })
      setEditingZoneId(null)
      await loadZones()
    } catch (err: any) { alert(err.message) }
    finally { setZoneBusy(false) }
  }

  const handleDeleteZone = async (z: any) => {
    const used = Number(z.points_count || 0)
    const msg = used > 0
      ? `Зона «${z.name}» используется ${used} точками. После удаления у этих точек зона будет очищена. Удалить?`
      : `Удалить зону «${z.name}»?`
    if (!confirm(msg)) return
    setZoneBusy(true)
    try {
      await zonesApi.delete(z.id, used > 0)
      await loadZones()
    } catch (err: any) { alert(err.message) }
    finally { setZoneBusy(false) }
  }

  useEffect(() => {
    adminSettingsApi.get()
      .then(data => {
        setSettings(data)
        setForm({ name: data.name || '', email: data.email || '', telegram_chat_id: data.telegram_chat_id || '', telegram_username: data.telegram_username || '' })
      })
      .catch(err => console.error('[AdminSettings]', err))
      .finally(() => setLoading(false))
    loadZones()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    // Предупреждение при смене email
    if (form.email !== settings?.email) {
      if (!confirm('При смене email следующий вход будет через новый email. Продолжить?')) return
    }
    try {
      const updated = await adminSettingsApi.update(form)
      setSettings(updated)
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <div className="text-sm text-loko-text-muted">Загрузка...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Настройки</h1>
        <p className="mt-1 text-sm text-loko-text-secondary">Профиль администратора, уведомления, системные параметры.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Профиль админа */}
        <div className="card p-5">
          <h3 className="text-base font-semibold text-loko-text-primary mb-4">Профиль администратора</h3>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Имя</label>
              <input className="input w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Email</label>
              <input type="email" className="input w-full" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <p className="mt-1 text-[10px] text-loko-text-muted">Email используется для входа. Смена email изменит логин.</p>
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Telegram username</label>
              <input className="input w-full" value={form.telegram_username} onChange={e => setForm({ ...form, telegram_username: e.target.value })} placeholder="@username" />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Telegram Chat ID</label>
              <input className="input w-full" value={form.telegram_chat_id} onChange={e => setForm({ ...form, telegram_chat_id: e.target.value })} placeholder="123456789" />
            </div>
            <button type="submit" className="btn-brand w-full">
              {saved ? '✓ Сохранено' : 'Сохранить'}
            </button>
          </form>
        </div>

        {/* Уведомления */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-loko-text-primary mb-4">Каналы уведомлений</h3>
          <div className="space-y-3">
            <div className="card-elevated p-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">📧</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-loko-text-primary">Email</div>
                  <div className="text-xs text-loko-text-muted">{form.email || 'Не указан'}</div>
                </div>
                <span className={`badge ${form.email ? 'badge-success' : 'badge-neutral'}`}>
                  {form.email ? 'Настроен' : 'Не настроен'}
                </span>
              </div>
            </div>
            <div className="card-elevated p-4">
              <div className="flex items-center gap-3">
                <span className="text-lg">💬</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-loko-text-primary">Telegram</div>
                  <div className="text-xs text-loko-text-muted">{form.telegram_username || 'Не указан'}</div>
                </div>
                <span className={`badge ${form.telegram_chat_id ? 'badge-success' : 'badge-neutral'}`}>
                  {form.telegram_chat_id ? 'Настроен' : 'Не настроен'}
                </span>
              </div>
            </div>
            <p className="text-xs text-loko-text-muted">
              Уведомления о новых заявках от партнёров будут приходить на настроенные каналы.
            </p>
          </div>
        </div>
      </div>

      {/* Системные параметры */}
      <div className="mt-4 card p-5">
        <h3 className="text-base font-semibold text-loko-text-primary">Системные параметры</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            { label: 'Версия', value: '0.2.0' },
            { label: 'Ограничение участия', value: '1 раз на точку (spin_participations)' },
            { label: 'Защита от конкурентов', value: 'По category организации' },
            { label: 'Сессия планшета', value: '7 дней (168 часов)' },
            { label: 'Лимит купонов', value: 'Через point_offers.max_count' },
            { label: 'Срок действия купона', value: '30 дней' },
          ].map(p => (
            <div key={p.label} className="card-elevated p-3">
              <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">{p.label}</div>
              <div className="mt-1 text-sm text-loko-text-primary">{p.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Справочник зон точек */}
      <div className="mt-4 card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-loko-text-primary">Зоны точек</h3>
            <p className="mt-0.5 text-xs text-loko-text-muted">Справочник зон — используется в карточках точек. Зона планшета наследуется от его точки.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={newZone}
              onChange={e => setNewZone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddZone()}
              placeholder="Новая зона…"
              className="input w-48"
            />
            <button onClick={handleAddZone} disabled={zoneBusy || !newZone.trim()} className="btn-brand disabled:opacity-50">
              <IconPlus size={16} />Добавить
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {zones.length === 0 && (
            <div className="rounded-xl border border-dashed border-loko-bg-border p-6 text-center text-sm text-loko-text-muted">
              Зон пока нет — добавьте первую выше
            </div>
          )}
          {zones.map(z => (
            <div key={z.id} className="card-elevated flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-loko-violet/10 text-loko-violet">
                <IconPin size={16} />
              </div>
              {editingZoneId === z.id ? (
                <>
                  <input
                    value={zoneDraft}
                    onChange={e => setZoneDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRenameZone(z.id)}
                    className="input flex-1"
                    autoFocus
                  />
                  <button onClick={() => handleRenameZone(z.id)} disabled={zoneBusy || !zoneDraft.trim()} className="btn-brand px-3 disabled:opacity-50" title="Сохранить"><IconCheck size={16} /></button>
                  <button onClick={() => setEditingZoneId(null)} className="btn-ghost px-2" title="Отмена"><IconClose size={16} /></button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-loko-text-primary">{z.name}</div>
                    <div className="text-xs text-loko-text-muted">
                      {Number(z.points_count || 0) > 0 ? `Используется ${z.points_count} точками` : 'Не используется'}
                    </div>
                  </div>
                  <button onClick={() => { setEditingZoneId(z.id); setZoneDraft(z.name) }} className="text-loko-text-muted hover:text-loko-violet" title="Переименовать"><IconEdit size={16} /></button>
                  <button onClick={() => handleDeleteZone(z)} disabled={zoneBusy} className="text-loko-text-muted hover:text-loko-danger" title="Удалить"><IconClose size={16} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
