import { useState, useEffect, type FC } from 'react'
import { ticketsApi } from '@/lib/api'
import { IconPlus, IconInbox, IconClock, IconCheck } from '@/components/ui/icons'

const statusMap: Record<string, { label: string; cls: string }> = {
  open: { label: 'Открыт', cls: 'badge-violet' },
  in_progress: { label: 'В работе', cls: 'badge-pink' },
  resolved: { label: 'Решено', cls: 'badge-success' },
  closed: { label: 'Закрыт', cls: 'badge-neutral' },
}

export const PartnerTickets: FC = () => {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    ticketsApi.list().then(setTickets).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!subject.trim() || !message.trim()) return
    setSending(true)
    try {
      const ticket = await ticketsApi.create({ subject, message })
      setTickets(prev => [ticket, ...prev])
      setSubject('')
      setMessage('')
      setShowForm(false)
    } catch (err) {
      console.error('[Tickets]', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Обращения</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Создайте обращение в поддержку. Уведомления придут на e-mail.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-brand">
          <IconPlus size={16} />Новое обращение
        </button>
      </div>

      {showForm && (
        <div className="card mb-4 space-y-3 p-5">
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Тема обращения"
            className="input w-full"
          />
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Опишите проблему или вопрос…"
            className="input w-full min-h-[100px] resize-y"
          />
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} disabled={sending} className="btn-brand disabled:opacity-50">
              {sending ? 'Отправка…' : 'Отправить'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">Отмена</button>
          </div>
        </div>
      )}

      {loading && <div className="py-12 text-center text-sm text-loko-text-muted">Загрузка…</div>}

      {!loading && tickets.length === 0 && !showForm && (
        <div className="card p-12 text-center">
          <IconInbox size={32} className="mx-auto text-loko-text-muted" />
          <div className="mt-3 text-lg font-semibold text-loko-text-primary">Нет обращений</div>
          <p className="mt-1 text-sm text-loko-text-secondary">Создайте обращение, если нужна помощь.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tickets.map(t => {
          const st = statusMap[t.status] ?? statusMap.open
          return (
            <div key={t.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-loko-text-primary">{t.subject}</h3>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                  </div>
                  <p className="mt-1 text-sm text-loko-text-secondary line-clamp-2">{t.message}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-loko-text-muted">
                    <IconClock size={12} />
                    {new Date(t.created_at).toLocaleString('ru')}
                    {t.resolved_at && (
                      <span className="inline-flex items-center gap-1 text-loko-success">
                        <IconCheck size={12} />Решено {new Date(t.resolved_at).toLocaleString('ru')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
