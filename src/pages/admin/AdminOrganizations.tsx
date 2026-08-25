import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { organizationsApi, invitationsApi } from '@/lib/api'
import { validateLogo } from '@/lib/image'
import { copyToClipboard } from '@/lib/clipboard'
import { IconPlus, IconSearch, IconFilter, IconPhone, IconPin, IconChevronRight, IconMail, IconClose, IconCheck, IconRefresh } from '@/components/ui/icons'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export function AdminOrganizations() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '', password: '', category: '',
    description: '', working_hours: '09:00-21:00', logo: '', logo_color: '#A855F7',
  })
  const [inviteOrgId, setInviteOrgId] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [createdInfo, setCreatedInfo] = useState<{ name: string; email: string; password: string; emailSent: boolean } | null>(null)
  const [deleteOrg, setDeleteOrg] = useState<any>(null)

  const reload = () => {
    setLoading(true)
    Promise.all([organizationsApi.list(), invitationsApi.list()])
      .then(([orgsData, invData]) => { setOrgs(orgsData); setInvitations(invData) })
      .catch(err => console.error('[Organizations]', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let pwd = ''
    for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
    setForm(p => ({ ...p, password: pwd }))
  }

  const handleCreate = async () => {
    if (!form.name || !form.address) return
    if (form.email && !form.password) return alert('Укажите пароль для аккаунта партнёра')
    setSaving(true)
    try {
      const result = await organizationsApi.create(form)
      const orgName = form.name
      setCreatedInfo({
        name: orgName,
        email: form.email,
        password: form.password,
        emailSent: result.emailSent ?? false,
      })
      setShowCreate(false)
      setForm({ name: '', address: '', phone: '', email: '', password: '', category: '', description: '', working_hours: '09:00-21:00', logo: '', logo_color: '#A855F7' })
      reload()
    } catch (err) {
      console.error('[Org create]', err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrg = async () => {
    if (!deleteOrg) return
    setSaving(true)
    try {
      await organizationsApi.delete(deleteOrg.id)
      setDeleteOrg(null)
      reload()
    } catch (err) {
      console.error('[Org delete]', err)
    } finally {
      setSaving(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteOrgId) return
    setSaving(true)
    try {
      const result = await invitationsApi.create({ org_id: inviteOrgId, email: inviteEmail || undefined })
      setInviteUrl(result.invite_url)
      setInviteEmail('')
      reload()
    } catch (err) {
      console.error('[Invite]', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Организации</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Партнёры, точки, разрешения на показ акций.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-loko-bg-border bg-loko-bg-surface/50 px-3 py-2 text-sm text-loko-text-muted md:w-64">
            <IconSearch size={16} />
            <input placeholder="Поиск организации…" className="w-full bg-transparent text-loko-text-primary placeholder:text-loko-text-muted focus:outline-none" />
          </div>
          {/* <button onClick={() => setShowInvite(true)} className="btn-ghost"><IconMail size={16} />Приглашение</button> */}
          <button onClick={() => setShowCreate(true)} className="btn-brand"><IconPlus size={16} />Создать</button>
        </div>
      </div>

      {/* Модалка создания организации */}
      {showCreate && (
        <div className="card mb-4 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-loko-text-primary">Новая организация</h3>
            <button onClick={() => setShowCreate(false)} className="text-loko-text-muted hover:text-loko-text-primary"><IconClose size={18} /></button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Название *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input w-full" placeholder="Кофейня «Утро»" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-loko-text-muted mb-1">Лого (200×200, ≤100 КБ)</label>
                <input type="file" accept="image/*" onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const dataUrl = await validateLogo(file)
                    setForm(p => ({ ...p, logo: dataUrl }))
                  } catch (err: any) { alert(err.message) }
                }} className="input w-full text-sm" />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-loko-text-muted mb-1">Цвет</label>
                <input type="color" value={form.logo_color} onChange={e => setForm(p => ({ ...p, logo_color: e.target.value }))} className="h-[38px] w-full cursor-pointer rounded-lg border border-loko-bg-border" />
              </div>
              <div
                className="flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-xl text-base font-bold text-white"
                style={{ background: form.logo_color }}
              >
                {form.logo?.startsWith('data:') ? <img src={form.logo} alt="logo" className="h-full w-full object-cover" /> : (form.logo || form.name?.[0] || '?')}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Категория</label>
              <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input w-full" placeholder="cafe, beauty, fitness…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Адрес *</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="input w-full" placeholder="ул. Ленина, 12" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Телефон</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input w-full" placeholder="+7 (999) 000-00-00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">E-mail</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input w-full" placeholder="partner@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Пароль {form.email && <span className="text-loko-pink">*</span>}</label>
              <div className="flex items-center gap-2">
                <input type="text" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input flex-1" placeholder="Пароль для входа партнёра" />
                <button type="button" onClick={generatePassword} className="shrink-0 rounded-lg border border-loko-bg-border px-2.5 py-2 text-xs font-medium text-loko-violet hover:bg-loko-violet/5" title="Сгенерировать пароль">
                  <IconRefresh size={16} />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Часы работы</label>
              <input value={form.working_hours} onChange={e => setForm(p => ({ ...p, working_hours: e.target.value }))} className="input w-full" placeholder="09:00-21:00" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-loko-text-muted mb-1">Описание</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input w-full min-h-[60px] resize-y" placeholder="Краткое описание бизнеса" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} disabled={saving} className="btn-brand disabled:opacity-50">
              {saving ? 'Создание…' : 'Создать организацию'}
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost">Отмена</button>
          </div>
        </div>
      )}

      {/* Модалка приглашения — временно скрыта
      {showInvite && (
        <div className="card mb-4 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-loko-text-primary">Приглашение партнёра</h3>
            <button onClick={() => { setShowInvite(false); setInviteUrl('') }} className="text-loko-text-muted hover:text-loko-text-primary"><IconClose size={18} /></button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Организация *</label>
              <select value={inviteOrgId} onChange={e => setInviteOrgId(e.target.value)} className="input w-full">
                <option value="">Выберите…</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">E-mail партнёра (необязательно)</label>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="input w-full" placeholder="partner@example.com" />
            </div>
          </div>
          <button onClick={handleInvite} disabled={saving || !inviteOrgId} className="btn-brand disabled:opacity-50">
            {saving ? 'Генерация…' : 'Сгенерировать ссылку'}
          </button>
          {inviteUrl && (
            <div className="rounded-xl border border-loko-pink/30 bg-loko-pink/5 p-3">
              <div className="text-xs text-loko-text-muted mb-1">Ссылка-приглашение (действует 7 дней):</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate text-sm text-loko-pink">{inviteUrl}</code>
                <button
                  onClick={() => { copyToClipboard(inviteUrl); }}
                  className="btn-ghost text-xs px-2 py-1"
                >
                  Копировать
                </button>
              </div>
            </div>
          )}

          {invitations.length > 0 && (
            <div className="mt-2">
              <div className="text-xs font-semibold text-loko-text-muted uppercase tracking-wider mb-2">Активные приглашения</div>
              <div className="flex flex-col gap-2">
                {invitations.filter(i => !i.used_at).map(inv => (
                  <div key={inv.id} className="card-elevated flex items-center gap-3 p-3">
                    <IconMail size={16} className="text-loko-pink" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-loko-text-primary">{inv.org_name || '—'}</div>
                      <div className="text-xs text-loko-text-muted">{inv.email || 'без email'} · до {new Date(inv.expires_at).toLocaleDateString('ru')}</div>
                    </div>
                    <span className="badge badge-violet">активно</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      */}

      {/* Уведомление о создании */}
      {createdInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCreatedInfo(null)}>
          <div className="card mx-4 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-loko-violet/10 text-loko-violet">
                <IconCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-loko-text-primary">Организация создана</h3>
                <p className="text-sm text-loko-text-muted">{createdInfo.name}</p>
              </div>
              <button onClick={() => setCreatedInfo(null)} className="ml-auto text-loko-text-muted hover:text-loko-text-primary"><IconClose size={18} /></button>
            </div>

            {createdInfo.email && (
              <div className="rounded-xl border border-loko-bg-border bg-loko-bg-base/50 p-4 space-y-2">
                <div className="text-xs font-medium uppercase tracking-wider text-loko-text-muted">Данные для входа</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-loko-text-secondary">Логин (email):</span>
                  <code className="text-sm font-semibold text-loko-text-primary">{createdInfo.email}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-loko-text-secondary">Пароль:</span>
                  <code className="text-sm font-semibold text-loko-text-primary">{createdInfo.password}</code>
                </div>
                <button
                  onClick={() => {
                    copyToClipboard(`Логин: ${createdInfo.email}\nПароль: ${createdInfo.password}`)
                  }}
                  className="btn-ghost w-full text-xs"
                >
                  Скопировать данные
                </button>
              </div>
            )}

            {createdInfo.email && (
              <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${createdInfo.emailSent ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                {createdInfo.emailSent ? <IconCheck size={16} /> : <IconMail size={16} />}
                {createdInfo.emailSent
                  ? 'Письмо с данными отправлено на ' + createdInfo.email
                  : 'SMTP не настроен — отправьте данные вручную'}
              </div>
            )}

            <button onClick={() => setCreatedInfo(null)} className="btn-brand w-full">Готово</button>
          </div>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-sm text-loko-text-muted">Загрузка…</div>
      )}

      {!loading && orgs.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-lg font-semibold text-loko-text-primary">Пока нет организаций</div>
          <p className="mt-1 text-sm text-loko-text-secondary">Создайте первую организацию, чтобы начать.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orgs.map(o => (
          <Link
            key={o.id}
            to={`/admin/organizations/${o.id}`}
            className="card group relative overflow-hidden p-5 transition-all hover:border-loko-pink/40"
          >
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-brand opacity-10 blur-2xl transition-opacity group-hover:opacity-20" />
            <div className="relative flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${o.logo_color ?? '#A855F7'} 0%, #A855F7 100%)` }}
              >
                {o.logo?.startsWith('data:') ? <img src={o.logo} alt="" className="h-full w-full object-cover" /> : (o.logo || o.name[0])}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-loko-text-primary">{o.name}</h3>
                  {o.has_tablet && <span className="badge badge-pink !py-0 !px-2 text-[10px]">планшет</span>}
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); setDeleteOrg(o) }}
                    className="ml-auto shrink-0 text-loko-text-muted transition-colors hover:text-loko-danger"
                    title="Удалить организацию"
                  >
                    <IconClose size={16} />
                  </button>
                </div>
                {o.category && <div className="text-xs text-loko-violet mt-0.5">{o.category}</div>}
                <div className="mt-1 flex items-center gap-1 text-xs text-loko-text-muted">
                  <IconPin size={12} /> {o.address}
                </div>
                <div className="mt-3 grid grid-cols-5 gap-2 text-center">
                  <div className="rounded-lg bg-loko-bg-base/40 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Акций</div>
                    <div className="mt-0.5 text-sm font-semibold text-loko-text-primary">{o.active_offers ?? 0}</div>
                  </div>
                  <div className="rounded-lg bg-loko-bg-base/40 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Точки</div>
                    <div className="mt-0.5 text-sm font-semibold text-loko-text-primary">{o.points_count ?? 0}</div>
                  </div>
                  <div className="rounded-lg bg-loko-bg-base/40 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Планшеты</div>
                    <div className="mt-0.5 text-sm font-semibold text-loko-text-primary">{o.tablets_count ?? 0}</div>
                  </div>
                  <div className="rounded-lg bg-loko-bg-base/40 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Лиды</div>
                    <div className="mt-0.5 text-sm font-semibold text-loko-text-primary">{Number(o.total_leads ?? 0).toLocaleString('ru')}</div>
                  </div>
                  <div className="rounded-lg bg-loko-bg-base/40 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Погаш.</div>
                    <div className="mt-0.5 text-sm font-semibold text-loko-pink">{Number(o.total_redeemed ?? 0).toLocaleString('ru')}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-loko-text-muted">
                  <span className="inline-flex items-center gap-1"><IconPhone size={12} />{o.phone}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-loko-bg-border pt-3 text-xs text-loko-text-muted">
              <span>с {new Date(o.created_at).toLocaleDateString('ru')}</span>
              <span className="inline-flex items-center gap-1 text-loko-pink">Карточка<IconChevronRight size={12} /></span>
            </div>
          </Link>
        ))}
      </div>

      {/* Подтверждение удаления организации */}
      <ConfirmDialog
        open={!!deleteOrg}
        message={deleteOrg ? `Организация «${deleteOrg.name}» и все её данные будут удалены безвозвратно.` : ''}
        onConfirm={handleDeleteOrg}
        onCancel={() => setDeleteOrg(null)}
      />
    </div>
  )
}
