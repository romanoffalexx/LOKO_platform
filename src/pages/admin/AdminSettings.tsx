import { useEffect, useState } from 'react'
import { adminSettingsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { IconShield, IconCheck } from '@/components/ui/icons'

export function AdminSettings() {
  const { user, refresh } = useAuth()
  const [settings, setSettings] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', telegram_chat_id: '', telegram_username: '' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminSettingsApi.get()
      .then(data => {
        setSettings(data)
        setForm({ name: data.name || '', email: data.email || '', telegram_chat_id: data.telegram_chat_id || '', telegram_username: data.telegram_username || '' })
      })
      .catch(err => console.error('[AdminSettings]', err))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
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
    </div>
  )
}
