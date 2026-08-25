import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { organizationsApi, offersApi, pointsApi, tabletsApi, screensApi, couponsApi, leadsApi } from '@/lib/api'
import { validateLogo } from '@/lib/image'
import { copyToClipboard } from '@/lib/clipboard'
import {
  IconPhone, IconMail, IconPin, IconShield, IconTablet, IconChevronRight,
  IconCheck, IconPlus, IconClose, IconEdit,
} from '@/components/ui/icons'
import { ZoneSelect } from '@/components/ui/ZoneSelect'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

function genPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let pwd = ''
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

export function AdminOrganizationDetail() {
  const { id } = useParams()
  const [org, setOrg] = useState<any>(null)
  const [orgOffers, setOrgOffers] = useState<any[]>([])
  const [allOffers, setAllOffers] = useState<any[]>([])
  const [tablets, setTablets] = useState<any[]>([])
  const [screens, setScreens] = useState<any[]>([])
  const [coupons, setCoupons] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'offers' | 'tablets' | 'monitors' | 'coupons' | 'participants' | 'points'>('offers')
  const [points, setPoints] = useState<any[]>([])
  const [showMonitorForm, setShowMonitorForm] = useState(false)
  const [savingTablet, setSavingTablet] = useState(false)
  const [savingMonitor, setSavingMonitor] = useState(false)
  const [editingMonitorId, setEditingMonitorId] = useState<string | null>(null)
  const [editingTabletId, setEditingTabletId] = useState<string | null>(null)
  const [expandedPointId, setExpandedPointId] = useState<string | null>(null)
  const [tabletForm, setTabletForm] = useState({ name: '', point: '', point_id: '', login: '', password: '' })
  const [showPwdTablet, setShowPwdTablet] = useState(false)
  const [origTabletPwd, setOrigTabletPwd] = useState('')
  const [createdTabletInfo, setCreatedTabletInfo] = useState<{ name: string; login: string; password: string; emailSent: boolean; partnerEmail: string | null } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'tablet' | 'offer'; id: string; name: string } | null>(null)
  const [monitorForm, setMonitorForm] = useState({ name: '', point: '', content: '', status: 'active', starts_at: '', ends_at: '' })
  const [loading, setLoading] = useState(true)
  const [showPointForm, setShowPointForm] = useState(false)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [savingPoint, setSavingPoint] = useState(false)
  const [savingOffer, setSavingOffer] = useState(false)
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null)
  const [showEditOrg, setShowEditOrg] = useState(false)
  const [savingOrg, setSavingOrg] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '', address: '', phone: '', email: '', category: '', description: '', working_hours: '', logo: '', logo_color: '#A855F7',
  })
  const [pointForm, setPointForm] = useState({
    name: '', address: '', phone: '', contact_name: '', email: '', working_hours: '09:00-21:00', has_tablet: false, zone: '',
  })
  const [offerForm, setOfferForm] = useState({
    title: '', description: '', starts_at: '', ends_at: '', zone: 'all',
    emoji: '🎁', bg_gradient: 'linear-gradient(135deg, #A855F7, #EC4899)',
    coupon_count: '100',
  })

  useEffect(() => {
    if (!id) return
    Promise.all([
      organizationsApi.get(id),
      offersApi.list(),
      tabletsApi.list({ organization_id: id }),
      screensApi.list({ organization_id: id }),
      couponsApi.list({ organization_id: id, limit: 50 }),
      leadsApi.list({ organization_id: id }),
      pointsApi.list({ organization_id: id }),
    ]).then(([orgData, offersData, tabletsData, screensData, couponsData, leadsData, pointsData]) => {
      setOrg(orgData)
      setOrgOffers(offersData.filter((o: any) => o.organization_id === id))
      setAllOffers(offersData)
      setTablets(tabletsData)
      setScreens(screensData)
      setCoupons(couponsData)
      setLeads(leadsData)
      setPoints(pointsData)
    }).catch(err => console.error('[OrgDetail]', err))
      .finally(() => setLoading(false))
  }, [id])

  const openEditOrg = () => {
    setEditForm({
      name: org.name || '', address: org.address || '', phone: org.phone || '',
      email: org.email || '', category: org.category || '',
      description: org.description || '', working_hours: org.working_hours || '',
      logo: org.logo || '', logo_color: org.logo_color || '#A855F7',
    })
    setShowEditOrg(true)
    setShowPointForm(false)
    setShowOfferForm(false)
  }

  const handleEditOrg = async () => {
    if (!id || !editForm.name || !editForm.address) return
    setSavingOrg(true)
    try {
      const updated = await organizationsApi.update(id, editForm)
      setOrg({ ...org, ...updated })
      setShowEditOrg(false)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSavingOrg(false)
    }
  }

  const handleCreatePoint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSavingPoint(true)
    try {
      const result = await pointsApi.create({ ...pointForm, organization_id: id })
      setShowPointForm(false)
      setPointForm({ name: '', address: '', phone: '', contact_name: '', email: '', working_hours: '09:00-21:00', has_tablet: false, zone: '' })

      // Перезагружаем данные организации
      const orgData = await organizationsApi.get(id)
      setOrg(orgData)

      // Если создан планшет — показываем попап с данными
      if (result.tablet) {
        setCreatedTabletInfo({
          name: pointForm.name,
          login: result.tablet.login,
          password: result.tablet.password,
          emailSent: false,
          partnerEmail: null,
        })
        // Перезагружаем список планшетов
        const tabletsData = await tabletsApi.list({ organization_id: id })
        setTablets(tabletsData)
      }

      // Перезагружаем точки
      const pointsData = await pointsApi.list({ organization_id: id })
      setPoints(pointsData)
    } catch (err: any) {
      console.error('[Point create]', err)
    } finally {
      setSavingPoint(false)
    }
  }

  const handleCreateOffer = async () => {
    if (!id || !offerForm.title) return
    setSavingOffer(true)
    try {
      await offersApi.create({
        ...offerForm,
        organization_id: id,
        coupon_count: Number(offerForm.coupon_count),
      })
      setShowOfferForm(false)
      setOfferForm({ title: '', description: '', starts_at: '', ends_at: '', zone: 'all', emoji: '🎁', bg_gradient: 'linear-gradient(135deg, #A855F7, #EC4899)', coupon_count: '100' })
      // Перезагружаем акции
      const offersData = await offersApi.list()
      setOrgOffers(offersData.filter((o: any) => o.organization_id === id))
      setAllOffers(offersData)
    } catch (err) {
      console.error('[Offer create]', err)
    } finally {
      setSavingOffer(false)
    }
  }

  const handleCreateMonitor = async () => {
    if (!id || !monitorForm.name) return
    setSavingMonitor(true)
    try {
      await screensApi.create({ ...monitorForm, organization_id: id })
      setShowMonitorForm(false)
      setMonitorForm({ name: '', point: '', content: '', status: 'active', starts_at: '', ends_at: '' })
      const data = await screensApi.list({ organization_id: id })
      setScreens(data)
    } catch (err) {
      console.error('[Monitor create]', err)
    } finally {
      setSavingMonitor(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    try {
      if (confirmDelete.type === 'tablet') {
        await tabletsApi.delete(confirmDelete.id)
        setTablets(prev => prev.filter(t => t.id !== confirmDelete.id))
      } else {
        await offersApi.delete(confirmDelete.id)
        setOrgOffers(prev => prev.filter(o => o.id !== confirmDelete.id))
        setAllOffers(prev => prev.filter(o => o.id !== confirmDelete.id))
      }
      setConfirmDelete(null)
    } catch (err) { console.error('[Delete]', err) }
  }

  const openEditTablet = (t: any) => {
    setEditingTabletId(t.id)
    const pwd = t.password_plain || ''
    setTabletForm({ name: t.name || '', point: t.point || '', point_id: t.point_id || '', login: t.login || '', password: pwd })
    setOrigTabletPwd(pwd)
    setShowPwdTablet(false)
  }

  const handleSaveEditTablet = async () => {
    if (!editingTabletId || !tabletForm.name) return
    setSavingTablet(true)
    try {
      const payload: Record<string, any> = { name: tabletForm.name, point: tabletForm.point, point_id: tabletForm.point_id }
      if (tabletForm.password && tabletForm.password !== origTabletPwd) payload.new_password = tabletForm.password
      await tabletsApi.update(editingTabletId, payload)
      setEditingTabletId(null)
      const data = await tabletsApi.list({ organization_id: id })
      setTablets(data)
    } catch (err) {
      console.error('[Tablet update]', err)
    } finally {
      setSavingTablet(false)
    }
  }

  const handleDeleteMonitor = async (monitorId: string) => {
    if (!confirm('Удалить монитор?')) return
    try {
      await screensApi.delete(monitorId)
      setScreens(prev => prev.filter(s => s.id !== monitorId))
    } catch (err) { console.error('[Monitor delete]', err) }
  }

  const openEditMonitor = (s: any) => {
    setEditingMonitorId(s.id)
    setMonitorForm({
      name: s.name || '',
      point: s.point || '',
      content: s.content || '',
      status: s.status || 'active',
      starts_at: s.starts_at?.slice(0, 10) || '',
      ends_at: s.ends_at?.slice(0, 10) || '',
    })
    setShowMonitorForm(false)
  }

  const handleSaveEditMonitor = async () => {
    if (!editingMonitorId || !monitorForm.name) return
    setSavingMonitor(true)
    try {
      await screensApi.update(editingMonitorId, {
        name: monitorForm.name,
        point: monitorForm.point,
        content: monitorForm.content,
        status: monitorForm.status,
        starts_at: monitorForm.starts_at || null,
        ends_at: monitorForm.ends_at || null,
      })
      setEditingMonitorId(null)
      const data = await screensApi.list({ organization_id: id })
      setScreens(data)
    } catch (err) {
      console.error('[Monitor update]', err)
    } finally {
      setSavingMonitor(false)
    }
  }

  const handleCancelCoupon = async (couponId: string) => {
    if (!confirm('Отменить купон?')) return
    try {
      await couponsApi.cancel(couponId)
      setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, status: 'cancelled' } : c))
    } catch (err) { console.error('[Coupon cancel]', err) }
  }

  const openEditOffer = (o: any) => {
    setEditingOfferId(o.id)
    setOfferForm({
      title: o.title || '',
      description: o.description || '',
      starts_at: o.starts_at?.slice(0, 10) || '',
      ends_at: o.ends_at?.slice(0, 10) || '',
      zone: o.zone || 'all',
      emoji: o.emoji || '🎁',
      bg_gradient: o.bg_gradient || 'linear-gradient(135deg, #A855F7, #EC4899)',
      coupon_count: String(o.coupon_count ?? 100),
    })
    setShowOfferForm(false)
  }

  // «Можно показывать»: разрешаем/запрещаем показ чужой акции на точках этой организации
  const toggleAllowedOffer = async (offer: any, checked: boolean) => {
    if (!id) return
    const current: string[] = offer.allowed_org_ids ?? []
    const next = checked
      ? [...current, id]
      : current.filter((x: string) => x !== id)
    try {
      await offersApi.update(offer.id, { allowed_org_ids: next })
      setAllOffers(prev => prev.map(o => o.id === offer.id ? { ...o, allowed_org_ids: next } : o))
    } catch (err) {
      console.error('[Offer allowed_org_ids]', err)
    }
  }

  const handleSaveEditOffer = async () => {
    if (!editingOfferId || !offerForm.title) return
    setSavingOffer(true)
    try {
      await offersApi.update(editingOfferId, {
        title: offerForm.title,
        description: offerForm.description,
        starts_at: offerForm.starts_at || null,
        ends_at: offerForm.ends_at || null,
        zone: offerForm.zone,
        emoji: offerForm.emoji,
        bg_gradient: offerForm.bg_gradient,
        coupon_count: Number(offerForm.coupon_count),
      })
      setEditingOfferId(null)
      const offersData = await offersApi.list()
      setOrgOffers(offersData.filter((o: any) => o.organization_id === id))
      setAllOffers(offersData)
    } catch (err) {
      console.error('[Offer update]', err)
    } finally {
      setSavingOffer(false)
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-loko-text-muted">Загрузка…</div>
  if (!org) return <div className="py-12 text-center text-loko-danger">Организация не найдена</div>

  const totalLeads = Number(org.total_leads ?? 0)
  const totalRedeemed = Number(org.total_redeemed ?? 0)
  const convPct = totalLeads > 0 ? `${(totalRedeemed / totalLeads * 100).toFixed(1)}%` : '—'

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-loko-text-secondary">
        <Link to="/admin/organizations" className="hover:text-loko-text-primary">Организации</Link>
        <IconChevronRight size={14} />
        <span className="text-loko-text-primary">{org.name}</span>
      </div>

      {/* Hero-карточка */}
      <div className="card-elevated relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-brand opacity-25 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-5">
            <div
              className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl text-2xl font-bold text-white shadow-glow-soft"
              style={{ background: `linear-gradient(135deg, ${org.logo_color ?? '#A855F7'} 0%, #A855F7 100%)` }}
            >
              {org.logo?.startsWith('data:') ? <img src={org.logo} alt="" className="h-full w-full object-cover" /> : (org.logo || org.name[0])}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">{org.name}</h1>
                {org.has_tablet && <span className="badge badge-pink">планшет</span>}
                {org.participates_in_offers && <span className="badge badge-violet">акции</span>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-loko-text-secondary">
                <span className="inline-flex items-center gap-1.5"><IconPin size={14} />{org.address}</span>
                <span className="inline-flex items-center gap-1.5"><IconPhone size={14} />{org.phone}</span>
                <span className="inline-flex items-center gap-1.5"><IconMail size={14} />{org.email}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={openEditOrg} className="btn-ghost"><IconEdit size={16} />Изменить</button>
            <button onClick={() => { setShowPointForm(!showPointForm); setShowOfferForm(false); setShowEditOrg(false) }} className="btn-outline"><IconPlus size={16} />Точка</button>
            <button onClick={() => { setShowOfferForm(!showOfferForm); setShowPointForm(false); setShowEditOrg(false) }} className="btn-brand"><IconPlus size={16} />Акция</button>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: 'Активных акций', value: Number(org.active_offers ?? 0) },
            { label: 'Получено лидов', value: totalLeads.toLocaleString('ru') },
            { label: 'Погашено купонов', value: totalRedeemed.toLocaleString('ru') },
            { label: 'Конверсия', value: convPct },
          ].map(m => (
            <div key={m.label} className="rounded-2xl border border-loko-bg-border bg-loko-bg-base/40 p-4">
              <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">{m.label}</div>
              <div className="mt-1 text-xl font-bold text-loko-text-primary">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Форма редактирования организации */}
      {showEditOrg && (
        <div className="card mt-4 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-loko-text-primary">Редактирование организации</h3>
            <button onClick={() => setShowEditOrg(false)} className="text-loko-text-muted hover:text-loko-text-primary"><IconClose size={18} /></button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Название *</label>
              <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="input w-full" />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs text-loko-text-muted mb-1">Лого (200×200, ≤100 КБ)</label>
                <input type="file" accept="image/*" onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const dataUrl = await validateLogo(file)
                    setEditForm(p => ({ ...p, logo: dataUrl }))
                  } catch (err: any) { alert(err.message) }
                }} className="input w-full text-sm" />
              </div>
              <div className="w-20">
                <label className="block text-xs text-loko-text-muted mb-1">Цвет</label>
                <input type="color" value={editForm.logo_color} onChange={e => setEditForm(p => ({ ...p, logo_color: e.target.value }))} className="h-[38px] w-full cursor-pointer rounded-lg border border-loko-bg-border" />
              </div>
              <div
                className="flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-xl text-base font-bold text-white"
                style={{ background: editForm.logo_color }}
              >
                {editForm.logo?.startsWith('data:') ? <img src={editForm.logo} alt="logo" className="h-full w-full object-cover" /> : (editForm.logo || editForm.name?.[0] || '?')}
              </div>
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Адрес *</label>
              <input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Телефон</label>
              <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Email</label>
              <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Категория</label>
              <input value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} className="input w-full" placeholder="pizzeria, coffee…" />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Часы работы</label>
              <input value={editForm.working_hours} onChange={e => setEditForm(p => ({ ...p, working_hours: e.target.value }))} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-loko-text-muted mb-1">Описание</label>
            <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="input w-full min-h-[60px] resize-y" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleEditOrg} disabled={savingOrg || !editForm.name || !editForm.address} className="btn-brand disabled:opacity-50">
              {savingOrg ? 'Сохранение…' : 'Сохранить'}
            </button>
            <button onClick={() => setShowEditOrg(false)} className="btn-ghost">Отмена</button>
          </div>
        </div>
      )}

      {/* Форма создания точки */}
      {showPointForm && (
        <form onSubmit={handleCreatePoint} className="card mt-4 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-loko-text-primary">Новая точка</h3>
            <button type="button" onClick={() => setShowPointForm(false)} className="text-loko-text-muted hover:text-loko-text-primary"><IconClose size={18} /></button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Название точки *</label>
              <input className="input w-full" value={pointForm.name} onChange={e => setPointForm(p => ({ ...p, name: e.target.value }))} required placeholder="ТРЦ Северный" />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Адрес *</label>
              <input className="input w-full" value={pointForm.address} onChange={e => setPointForm(p => ({ ...p, address: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Телефон</label>
              <input className="input w-full" value={pointForm.phone} onChange={e => setPointForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Контактное имя</label>
              <input className="input w-full" value={pointForm.contact_name} onChange={e => setPointForm(p => ({ ...p, contact_name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Email</label>
              <input type="email" className="input w-full" value={pointForm.email} onChange={e => setPointForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Часы работы</label>
              <input className="input w-full" value={pointForm.working_hours} onChange={e => setPointForm(p => ({ ...p, working_hours: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Зона</label>
              <ZoneSelect value={pointForm.zone} onChange={v => setPointForm(p => ({ ...p, zone: v }))} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="pt_has_tablet" checked={pointForm.has_tablet} onChange={e => setPointForm(p => ({ ...p, has_tablet: e.target.checked }))} className="h-4 w-4" />
            <label htmlFor="pt_has_tablet" className="text-sm text-loko-text-primary">Есть планшет</label>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={savingPoint} className="btn-brand disabled:opacity-50">{savingPoint ? 'Создание…' : 'Создать точку'}</button>
            <button type="button" onClick={() => setShowPointForm(false)} className="btn-ghost">Отмена</button>
          </div>
        </form>
      )}

      {/* Форма создания акции */}
      {showOfferForm && (
        <div className="card mt-4 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-loko-text-primary">Новая акция — {org.name}</h3>
            <button onClick={() => setShowOfferForm(false)} className="text-loko-text-muted hover:text-loko-text-primary"><IconClose size={18} /></button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Название *</label>
              <input value={offerForm.title} onChange={e => setOfferForm(p => ({ ...p, title: e.target.value }))} className="input w-full" placeholder="Скидка 20% на кофе" />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Дата начала</label>
              <input type="date" value={offerForm.starts_at} onChange={e => setOfferForm(p => ({ ...p, starts_at: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Дата окончания</label>
              <input type="date" value={offerForm.ends_at} onChange={e => setOfferForm(p => ({ ...p, ends_at: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Зона</label>
              <input value={offerForm.zone} onChange={e => setOfferForm(p => ({ ...p, zone: e.target.value }))} className="input w-full" placeholder="all" />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Эмодзи</label>
              <input value={offerForm.emoji} onChange={e => setOfferForm(p => ({ ...p, emoji: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-loko-text-muted mb-1">Кол-во купонов</label>
              <input type="number" value={offerForm.coupon_count} onChange={e => setOfferForm(p => ({ ...p, coupon_count: e.target.value }))} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-loko-text-muted mb-1">Описание</label>
            <textarea value={offerForm.description} onChange={e => setOfferForm(p => ({ ...p, description: e.target.value }))} className="input w-full min-h-[60px] resize-y" placeholder="Описание акции" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCreateOffer} disabled={savingOffer || !offerForm.title} className="btn-brand disabled:opacity-50">
              {savingOffer ? 'Создание…' : 'Создать акцию'}
            </button>
            <button onClick={() => setShowOfferForm(false)} className="btn-ghost">Отмена</button>
          </div>
        </div>
      )}

      {/* Вкладки */}
      <div className="mt-6">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-loko-bg-border bg-loko-bg-base/40 p-1">
          {[
            { key: 'offers', label: 'Акции', count: orgOffers.length },
            { key: 'points', label: 'Точки', count: points.length },
            { key: 'tablets', label: 'Планшеты', count: tablets.length },
            { key: 'monitors', label: 'Мониторы', count: screens.length },
            { key: 'coupons', label: 'Купоны', count: coupons.length },
            { key: 'participants', label: 'Участники', count: leads.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-loko-bg-card text-loko-text-primary shadow-sm'
                  : 'text-loko-text-muted hover:text-loko-text-secondary'
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === tab.key ? 'bg-loko-pink/10 text-loko-pink' : 'bg-loko-bg-border/50 text-loko-text-muted'
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Содержимое вкладок */}
      <div className="mt-4">
        {/* ── Акции ── */}
        {activeTab === 'offers' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-base font-semibold text-loko-text-primary">Свои акции</div>
                <button onClick={() => { setShowOfferForm(!showOfferForm); setShowPointForm(false) }} className="btn-outline px-3 py-1.5 text-xs"><IconPlus size={14} />Создать</button>
              </div>
              <div className="flex flex-col gap-2">
                {orgOffers.length === 0 && (
                  <div className="rounded-xl border border-dashed border-loko-bg-border p-6 text-center text-sm text-loko-text-muted">
                    У организации пока нет своих акций
                  </div>
                )}
                {orgOffers.map(o => (
                  <div key={o.id}>
                    {editingOfferId === o.id ? (
                      /* Inline edit form */
                      <div className="card-elevated space-y-3 p-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div>
                            <label className="block text-xs text-loko-text-muted mb-1">Название *</label>
                            <input value={offerForm.title} onChange={e => setOfferForm(p => ({ ...p, title: e.target.value }))} className="input w-full" />
                          </div>
                          <div>
                            <label className="block text-xs text-loko-text-muted mb-1">Эмодзи</label>
                            <input value={offerForm.emoji} onChange={e => setOfferForm(p => ({ ...p, emoji: e.target.value }))} className="input w-full" />
                          </div>
                          <div>
                            <label className="block text-xs text-loko-text-muted mb-1">Дата начала</label>
                            <input type="date" value={offerForm.starts_at} onChange={e => setOfferForm(p => ({ ...p, starts_at: e.target.value }))} className="input w-full" />
                          </div>
                          <div>
                            <label className="block text-xs text-loko-text-muted mb-1">Дата окончания</label>
                            <input type="date" value={offerForm.ends_at} onChange={e => setOfferForm(p => ({ ...p, ends_at: e.target.value }))} className="input w-full" />
                          </div>
                          <div>
                            <label className="block text-xs text-loko-text-muted mb-1">Зона</label>
                            <input value={offerForm.zone} onChange={e => setOfferForm(p => ({ ...p, zone: e.target.value }))} className="input w-full" />
                          </div>
                          <div>
                            <label className="block text-xs text-loko-text-muted mb-1">Кол-во купонов</label>
                            <input type="number" value={offerForm.coupon_count} onChange={e => setOfferForm(p => ({ ...p, coupon_count: e.target.value }))} className="input w-full" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-loko-text-muted mb-1">Описание</label>
                          <textarea value={offerForm.description} onChange={e => setOfferForm(p => ({ ...p, description: e.target.value }))} className="input w-full min-h-[50px] resize-y" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSaveEditOffer} disabled={savingOffer || !offerForm.title} className="btn-brand disabled:opacity-50">{savingOffer ? 'Сохранение…' : 'Сохранить'}</button>
                          <button onClick={() => setEditingOfferId(null)} className="btn-ghost">Отмена</button>
                        </div>
                      </div>
                    ) : (
                      /* Card view */
                      <div className="card-elevated group flex items-center gap-3 p-3">
                        <Link to={`/admin/offers/${o.id}`} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ background: o.bg_gradient }}>
                          {o.emoji}
                        </Link>
                        <Link to={`/admin/offers/${o.id}`} className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-loko-text-primary">{o.title}</div>
                          <div className="text-xs text-loko-text-muted">
                            {o.starts_at?.slice(0, 10)} → {o.ends_at?.slice(0, 10)} · {o.total_issued} выдано · {o.total_redeemed} погашено
                          </div>
                        </Link>
                        <span className={`badge ${o.status === 'active' ? 'badge-success' : o.status === 'scheduled' ? 'badge-violet' : 'badge-neutral'}`}>
                          {o.status === 'active' ? 'идёт' : o.status === 'scheduled' ? 'скоро' : 'архив'}
                        </span>
                        <button onClick={() => openEditOffer(o)} className="text-loko-text-muted hover:text-loko-pink" title="Редактировать"><IconEdit size={16} /></button>
                        <button onClick={() => setConfirmDelete({ type: 'offer', id: o.id, name: o.title })} className="text-loko-text-muted hover:text-loko-danger" title="Удалить"><IconClose size={16} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-base font-semibold text-loko-text-primary">Можно показывать</div>
                <span className="text-xs text-loko-text-muted">галочками</span>
              </div>
              <div className="flex flex-col gap-2">
                {allOffers.filter(o => o.organization_id !== id).map(o => {
                  const checked = (o.allowed_org_ids ?? []).includes(id)
                  return (
                    <label key={o.id} className="card-elevated flex cursor-pointer items-center gap-3 p-3 hover:border-loko-pink/40">
                      <input type="checkbox" checked={checked} onChange={e => toggleAllowedOffer(o, e.target.checked)} className="peer sr-only" />
                      <span className="pointer-events-none flex h-5 w-5 items-center justify-center rounded-md border border-loko-bg-border bg-loko-bg-base/60 peer-checked:border-loko-pink peer-checked:bg-gradient-brand">
                        {checked && <IconCheck size={12} className="text-white" />}
                      </span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg text-lg" style={{ background: o.bg_gradient }}>{o.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-loko-text-primary">{o.title}</div>
                        <div className="text-xs text-loko-text-muted">{o.organization_name}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Точки ── */}
        {activeTab === 'points' && (
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold text-loko-text-primary">Точки</div>
              <button onClick={() => setShowPointForm(!showPointForm)} className="btn-outline px-3 py-1.5 text-xs"><IconPlus size={14} />Добавить</button>
            </div>
            {/* Список точек */}
            <div className="flex flex-col gap-2">
              {points.length === 0 && (
                <div className="rounded-xl border border-dashed border-loko-bg-border p-6 text-center text-sm text-loko-text-muted">
                  У организации пока нет точек
                </div>
              )}
              {points.map(p => {
                const pointTablets = tablets.filter(t => t.point_id === p.id)
                const isExpanded = expandedPointId === p.id
                return (
                <div key={p.id} className="card-elevated overflow-hidden">
                  <div
                    className={`flex items-center gap-3 p-3 ${p.has_tablet ? 'cursor-pointer hover:bg-loko-bg-surface/40' : ''}`}
                    onClick={() => p.has_tablet && setExpandedPointId(isExpanded ? null : p.id)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loko-violet/10 text-loko-violet">
                      <IconPin size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-loko-text-primary">{p.name}</div>
                      <div className="text-xs text-loko-text-muted">
                        {p.address} · {p.phone || '—'} · {p.working_hours || '—'}
                      </div>
                    </div>
                    {p.has_tablet && (
                      <span className="badge badge-pink">планшет</span>
                    )}
                    <span className={`badge ${p.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {p.is_active ? 'активна' : 'скрыта'}
                    </span>
                    {p.has_tablet && (
                      <IconChevronRight size={16} className={`text-loko-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    )}
                  </div>

                  {/* Раскрытая точка: планшеты */}
                  {isExpanded && (
                    <div className="border-t border-loko-bg-border bg-loko-bg-base/40 p-3 space-y-2">
                      {pointTablets.length === 0 && (
                        <div className="text-xs text-loko-text-muted">Планшет ещё не создан.</div>
                      )}
                      {pointTablets.map(t => (
                        <div key={t.id} className="flex items-center gap-3 rounded-xl border border-loko-bg-border bg-loko-bg-elevated/50 p-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-loko-pink/10 text-loko-pink">
                            <IconTablet size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-loko-text-primary">{t.name}</div>
                            <div className="font-mono text-[11px] text-loko-pink">
                              {t.login} · {t.password_plain || 'пароль не задан'}
                            </div>
                          </div>
                          <button onClick={() => { setActiveTab('tablets'); openEditTablet(t) }} className="text-loko-text-muted hover:text-loko-violet" title="Редактировать"><IconEdit size={16} /></button>
                          <button onClick={() => setConfirmDelete({ type: 'tablet', id: t.id, name: t.name })} className="text-loko-text-muted hover:text-loko-danger" title="Удалить"><IconClose size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Планшеты ── */}
        {activeTab === 'tablets' && (
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-base font-semibold text-loko-text-primary">Планшеты</div>
              <div className="text-right text-xs text-loko-text-muted">1 точка = 1 планшет. Создание — при добавлении точки во вкладке «Точки»</div>
            </div>
            <div className="flex flex-col gap-2">
              {tablets.length === 0 && (
                <div className="rounded-xl border border-dashed border-loko-bg-border p-6 text-center text-sm text-loko-text-muted">
                  У организации пока нет планшетов
                </div>
              )}
              {tablets.map(t => (
                <div key={t.id}>
                  {editingTabletId === t.id ? (
                    <div className="card-elevated space-y-3 p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs text-loko-text-muted mb-1">Название *</label>
                          <input value={tabletForm.name} onChange={e => setTabletForm(p => ({ ...p, name: e.target.value }))} className="input w-full" />
                        </div>
                        <div>
                          <label className="block text-xs text-loko-text-muted mb-1">Точка</label>
                          <select
                            value={tabletForm.point_id}
                            onChange={e => {
                              const pid = e.target.value
                              const selected = points.find(p => p.id === pid)
                              setTabletForm(p => ({ ...p, point_id: pid, point: selected?.name || '' }))
                            }}
                            className="input w-full"
                          >
                            {points.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.address})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-loko-text-muted mb-1">Зона (от точки)</label>
                          <input value={points.find(p => p.id === tabletForm.point_id)?.zone || '—'} readOnly className="input w-full opacity-60" title="Зона наследуется от точки" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs text-loko-text-muted mb-1">Логин</label>
                          <div className="flex items-center gap-2">
                            <input value={tabletForm.login} readOnly className="input w-full font-mono" />
                            <button onClick={() => copyToClipboard(tabletForm.login)} className="btn-ghost px-2" title="Скопировать логин">📋</button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-loko-text-muted mb-1">Пароль</label>
                          <div className="flex items-center gap-2">
                            <input type={showPwdTablet ? 'text' : 'password'} value={tabletForm.password} onChange={e => setTabletForm(p => ({ ...p, password: e.target.value }))} className="input w-full font-mono" />
                            <button onClick={() => setShowPwdTablet(s => !s)} className="btn-ghost px-2" title={showPwdTablet ? 'Скрыть' : 'Показать'}>{showPwdTablet ? '🙈' : '👁️'}</button>
                            <button onClick={() => { setTabletForm(p => ({ ...p, password: genPassword() })); setShowPwdTablet(true) }} className="btn-ghost px-2" title="Сгенерировать">🎲</button>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveEditTablet} disabled={savingTablet || !tabletForm.name} className="btn-brand disabled:opacity-50">{savingTablet ? 'Сохранение…' : 'Сохранить'}</button>
                        <button onClick={() => setEditingTabletId(null)} className="btn-ghost">Отмена</button>
                      </div>
                    </div>
                  ) : (
                    <div className="card-elevated flex items-center gap-3 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loko-pink/10 text-loko-pink">
                        <IconTablet size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-loko-text-primary">{t.name}</div>
                        <div className="text-xs text-loko-text-muted">
                          {t.point_name || t.point || '—'} · {t.point_zone || t.zone || '—'}
                        </div>
                        {t.login && (
                          <div className="mt-0.5 font-mono text-[11px] text-loko-pink">
                            {t.login} · {t.password_plain ? '••••••••' : 'пароль не задан'}
                          </div>
                        )}
                      </div>
                      <button onClick={() => openEditTablet(t)} className="text-loko-text-muted hover:text-loko-violet"><IconEdit size={16} /></button>
                      <button onClick={() => setConfirmDelete({ type: 'tablet', id: t.id, name: t.name })} className="text-loko-text-muted hover:text-loko-danger"><IconClose size={16} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Мониторы ── */}
        {activeTab === 'monitors' && (
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold text-loko-text-primary">Мониторы</div>
              <button onClick={() => setShowMonitorForm(!showMonitorForm)} className="btn-outline px-3 py-1.5 text-xs"><IconPlus size={14} />Добавить</button>
            </div>
            {showMonitorForm && (
              <div className="mb-4 rounded-2xl border border-loko-bg-border bg-loko-bg-base/40 p-4 space-y-3">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-xs text-loko-text-muted mb-1">Название *</label>
                    <input value={monitorForm.name} onChange={e => setMonitorForm(p => ({ ...p, name: e.target.value }))} className="input w-full" placeholder="Монитор 1" />
                  </div>
                  <div>
                    <label className="block text-xs text-loko-text-muted mb-1">Точка</label>
                    <input value={monitorForm.point} onChange={e => setMonitorForm(p => ({ ...p, point: e.target.value }))} className="input w-full" placeholder="Точка 1" />
                  </div>
                  <div>
                    <label className="block text-xs text-loko-text-muted mb-1">Дата начала</label>
                    <input type="date" value={monitorForm.starts_at} onChange={e => setMonitorForm(p => ({ ...p, starts_at: e.target.value }))} className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-xs text-loko-text-muted mb-1">Дата окончания</label>
                    <input type="date" value={monitorForm.ends_at} onChange={e => setMonitorForm(p => ({ ...p, ends_at: e.target.value }))} className="input w-full" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-loko-text-muted mb-1">Контент</label>
                  <textarea value={monitorForm.content} onChange={e => setMonitorForm(p => ({ ...p, content: e.target.value }))} className="input w-full min-h-[60px] resize-y" placeholder="Описание контента" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreateMonitor} disabled={savingMonitor || !monitorForm.name} className="btn-brand disabled:opacity-50">{savingMonitor ? 'Создание…' : 'Создать'}</button>
                  <button onClick={() => setShowMonitorForm(false)} className="btn-ghost">Отмена</button>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {screens.length === 0 && (
                <div className="rounded-xl border border-dashed border-loko-bg-border p-6 text-center text-sm text-loko-text-muted">
                  У организации пока нет мониторов
                </div>
              )}
              {screens.map(s => (
                <div key={s.id}>
                  {editingMonitorId === s.id ? (
                    /* Inline edit form */
                    <div className="card-elevated space-y-3 p-4">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="block text-xs text-loko-text-muted mb-1">Название *</label>
                          <input value={monitorForm.name} onChange={e => setMonitorForm(p => ({ ...p, name: e.target.value }))} className="input w-full" />
                        </div>
                        <div>
                          <label className="block text-xs text-loko-text-muted mb-1">Точка</label>
                          <input value={monitorForm.point} onChange={e => setMonitorForm(p => ({ ...p, point: e.target.value }))} className="input w-full" />
                        </div>
                        <div>
                          <label className="block text-xs text-loko-text-muted mb-1">Дата начала</label>
                          <input type="date" value={monitorForm.starts_at} onChange={e => setMonitorForm(p => ({ ...p, starts_at: e.target.value }))} className="input w-full" />
                        </div>
                        <div>
                          <label className="block text-xs text-loko-text-muted mb-1">Дата окончания</label>
                          <input type="date" value={monitorForm.ends_at} onChange={e => setMonitorForm(p => ({ ...p, ends_at: e.target.value }))} className="input w-full" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-loko-text-muted mb-1">Контент</label>
                        <textarea value={monitorForm.content} onChange={e => setMonitorForm(p => ({ ...p, content: e.target.value }))} className="input w-full min-h-[50px] resize-y" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveEditMonitor} disabled={savingMonitor || !monitorForm.name} className="btn-brand disabled:opacity-50">{savingMonitor ? 'Сохранение…' : 'Сохранить'}</button>
                        <button onClick={() => setEditingMonitorId(null)} className="btn-ghost">Отмена</button>
                      </div>
                    </div>
                  ) : (
                    /* Card view */
                    <div className="card-elevated flex items-center gap-3 p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 text-lg font-bold">🖥</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-loko-text-primary">{s.name}</div>
                        <div className="text-xs text-loko-text-muted">
                          {s.point || '—'}{s.starts_at && ` · ${s.starts_at.slice(0, 10)} → ${s.ends_at?.slice(0, 10)}`}
                        </div>
                      </div>
                      <span className={`badge ${s.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{s.status || 'active'}</span>
                      <button onClick={() => openEditMonitor(s)} className="text-loko-text-muted hover:text-loko-pink" title="Редактировать"><IconEdit size={16} /></button>
                      <button onClick={() => handleDeleteMonitor(s.id)} className="text-loko-text-muted hover:text-loko-danger" title="Удалить"><IconClose size={16} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Купоны ── */}
        {activeTab === 'coupons' && (
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold text-loko-text-primary">Купоны</div>
              <span className="text-xs text-loko-text-muted">{coupons.length} шт.</span>
            </div>
            <div className="flex flex-col gap-2">
              {coupons.length === 0 && (
                <div className="rounded-xl border border-dashed border-loko-bg-border p-6 text-center text-sm text-loko-text-muted">
                  У организации пока нет купонов
                </div>
              )}
              {coupons.map(c => (
                <div key={c.id} className="card-elevated flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 text-lg font-bold">🎟</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-loko-text-primary">{c.code}</div>
                    <div className="text-xs text-loko-text-muted">
                      {c.offer_title || '—'} · {c.user_name || '—'} {c.user_phone && `· ${c.user_phone}`}
                    </div>
                  </div>
                  <span className={`badge ${c.status === 'active' ? 'badge-success' : c.status === 'redeemed' ? 'badge-violet' : c.status === 'cancelled' ? 'badge-danger' : 'badge-neutral'}`}>
                    {c.status === 'active' ? 'активен' : c.status === 'redeemed' ? 'погашён' : c.status === 'cancelled' ? 'отменён' : c.status}
                  </span>
                  {c.status === 'active' && (
                    <button onClick={() => handleCancelCoupon(c.id)} className="text-xs text-loko-text-muted hover:text-loko-danger">Отменить</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Участники ── */}
        {activeTab === 'participants' && (
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold text-loko-text-primary">Участники / Лиды</div>
              <span className="text-xs text-loko-text-muted">{leads.length} чел.</span>
            </div>
            <div className="flex flex-col gap-2">
              {leads.length === 0 && (
                <div className="rounded-xl border border-dashed border-loko-bg-border p-6 text-center text-sm text-loko-text-muted">
                  У организации пока нет участников
                </div>
              )}
              {leads.map(l => (
                <div key={l.id} className="card-elevated flex items-center gap-3 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 text-sm font-bold">
                    {l.client_name?.[0] || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-loko-text-primary">{l.client_name || '—'}</div>
                    <div className="text-xs text-loko-text-muted">
                      {l.client_phone || '—'} · {l.offer_title || '—'}{l.source_point && ` · ${l.source_point}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {l.contacted && <span className="badge badge-violet">связались</span>}
                    {l.redeemed && <span className="badge badge-success">погашено</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Подсказка о безопасности */}
      <div className="mt-4 card flex items-center gap-3 border-loko-pink/30 bg-loko-pink/5 p-4 text-sm text-loko-text-secondary">
        <IconShield size={18} className="text-loko-pink" />
        <span>Доступ к общей клиентской базе партнёру не предоставляется — только лиды по акциям организации.</span>
      </div>

      {/* Модальное окно с данными планшета */}
      {createdTabletInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setCreatedTabletInfo(null)}>
          <div className="card mx-4 w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-loko-pink/10 text-loko-pink">
                <IconTablet size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-loko-text-primary">Планшет создан</h3>
                <p className="text-sm text-loko-text-muted">{createdTabletInfo.name}</p>
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
              <button
                onClick={() => {
                  copyToClipboard(`Логин: ${createdTabletInfo.login}\nПароль: ${createdTabletInfo.password}`)
                }}
                className="btn-ghost w-full text-xs"
              >
                Скопировать данные
              </button>
            </div>

            {createdTabletInfo.partnerEmail && (
              <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${createdTabletInfo.emailSent ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                {createdTabletInfo.emailSent ? <IconCheck size={16} /> : <IconMail size={16} />}
                {createdTabletInfo.emailSent
                  ? 'Письмо отправлено на ' + createdTabletInfo.partnerEmail
                  : 'SMTP не настроен — отправьте данные вручную'}
              </div>
            )}

            <button onClick={() => setCreatedTabletInfo(null)} className="btn-brand w-full">Готово</button>
          </div>
        </div>
      )}

      {/* Подтверждение удаления планшета/акции */}
      <ConfirmDialog
        open={!!confirmDelete}
        message={confirmDelete ? `${confirmDelete.type === 'tablet' ? 'Планшет' : 'Акция'} «${confirmDelete.name}» будет удален(а) безвозвратно.` : ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
