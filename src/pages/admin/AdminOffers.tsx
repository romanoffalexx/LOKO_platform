import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { offersApi, organizationsApi } from '@/lib/api'
import { IconSearch, IconFilter, IconDownload, IconPlus, IconCalendar, IconPin, IconClose } from '@/components/ui/icons'

export function AdminOffers() {
  const [offers, setOffers] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', organization_id: '',
    starts_at: '', ends_at: '', zone: 'all',
    emoji: '🎁', bg_gradient: 'linear-gradient(135deg, #A855F7, #EC4899)',
    coupon_count: '100', weight: '1',
  })

  const reload = () => {
    setLoading(true)
    Promise.all([offersApi.list(), organizationsApi.list()])
      .then(([offersData, orgsData]) => { setOffers(offersData); setOrgs(orgsData) })
      .catch(err => console.error('[Offers]', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [])

  const handleCreate = async () => {
    if (!form.title || !form.organization_id) return
    setSaving(true)
    try {
      await offersApi.create({
        ...form,
        organization_id: form.organization_id,
        coupon_count: Number(form.coupon_count),
        weight: Number(form.weight),
      })
      setShowCreate(false)
      setForm({ title: '', description: '', organization_id: '', starts_at: '', ends_at: '', zone: 'all', emoji: '🎁', bg_gradient: 'linear-gradient(135deg, #A855F7, #EC4899)', coupon_count: '100', weight: '1' })
      reload()
    } catch (err) {
      console.error('[Offer create]', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">Акции</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Календарный период, разрешённые точки, визуал, условия.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-loko-bg-border bg-loko-bg-surface/50 px-3 py-2 text-sm text-loko-text-muted md:w-64">
            <IconSearch size={16} />
            <input placeholder="Поиск акции…" className="w-full bg-transparent text-loko-text-primary placeholder:text-loko-text-muted focus:outline-none" />
          </div>
          <button className="btn-ghost"><IconFilter size={16} />Фильтры</button>
          <button className="btn-ghost"><IconDownload size={16} /></button>
          <button onClick={() => setShowCreate(true)} className="btn-brand"><IconPlus size={16} />Создать акцию</button>
        </div>
      </div>

      {/* Модалка создания акции */}
      {showCreate && (
        <div className="card mb-4 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-loko-text-primary">Новая акция</h3>
            <button onClick={() => setShowCreate(false)} className="text-loko-text-muted hover:text-loko-text-primary"><IconClose size={18} /></button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Название *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input w-full" placeholder="Скидка 20% на кофе" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Организация *</label>
              <select value={form.organization_id} onChange={e => setForm(p => ({ ...p, organization_id: e.target.value }))} className="input w-full">
                <option value="">Выберите…</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Дата начала</label>
              <input type="date" value={form.starts_at} onChange={e => setForm(p => ({ ...p, starts_at: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Дата окончания</label>
              <input type="date" value={form.ends_at} onChange={e => setForm(p => ({ ...p, ends_at: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Зона</label>
              <input value={form.zone} onChange={e => setForm(p => ({ ...p, zone: e.target.value }))} className="input w-full" placeholder="all, center, north…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Эмодзи</label>
              <input value={form.emoji} onChange={e => setForm(p => ({ ...p, emoji: e.target.value }))} className="input w-full" placeholder="🎁" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Кол-во купонов</label>
              <input type="number" value={form.coupon_count} onChange={e => setForm(p => ({ ...p, coupon_count: e.target.value }))} className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-medium text-loko-text-muted mb-1">Вес</label>
              <input type="number" value={form.weight} onChange={e => setForm(p => ({ ...p, weight: e.target.value }))} className="input w-full" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-loko-text-muted mb-1">Описание</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input w-full min-h-[60px] resize-y" placeholder="Описание акции для партнёров" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCreate} disabled={saving} className="btn-brand disabled:opacity-50">
              {saving ? 'Создание…' : 'Создать акцию'}
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost">Отмена</button>
          </div>
        </div>
      )}

      {loading && <div className="py-12 text-center text-sm text-loko-text-muted">Загрузка…</div>}

      {!loading && offers.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-lg font-semibold text-loko-text-primary">Пока нет акций</div>
          <p className="mt-1 text-sm text-loko-text-secondary">Создайте первую акцию.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {offers.map(o => (
          <Link key={o.id} to={`/admin/offers/${o.id}`} className="card group relative overflow-hidden transition-all hover:border-loko-pink/40">
            {/* Визуал-шапка */}
            <div className="relative h-36 overflow-hidden" style={{ background: o.bg_gradient }}>
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/40" />
              <div className="absolute right-3 top-3 text-5xl opacity-90">{o.emoji}</div>
              <div className="absolute bottom-3 left-4 right-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/70">{o.organization_name}</div>
                <div className="mt-0.5 text-lg font-bold leading-tight text-white">{o.title}</div>
              </div>
            </div>

            <div className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-xs text-loko-text-muted">
                <IconCalendar size={12} />
                {o.starts_at?.slice(0, 10)} → {o.ends_at?.slice(0, 10)}
              </div>
              <div className="flex items-center gap-2 text-xs text-loko-text-muted">
                <IconPin size={12} />{o.zone}
              </div>
              <p className="line-clamp-2 text-sm text-loko-text-secondary">{o.description}</p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="rounded-lg bg-loko-bg-base/40 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Выдано</div>
                  <div className="text-sm font-semibold text-loko-text-primary">{o.total_issued}</div>
                </div>
                <div className="rounded-lg bg-loko-bg-base/40 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Погаш.</div>
                  <div className="text-sm font-semibold text-loko-pink">{o.total_redeemed}</div>
                </div>
                <div className="rounded-lg bg-loko-bg-base/40 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">Вес</div>
                  <div className="text-sm font-semibold text-loko-text-primary">{o.weight}</div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className={`badge ${o.status === 'active' ? 'badge-success' : o.status === 'scheduled' ? 'badge-violet' : 'badge-neutral'}`}>
                  {o.status === 'active' ? 'идёт' : o.status === 'scheduled' ? 'запланирована' : 'архив'}
                </span>
                <span className="text-xs text-loko-text-muted">{(o.allowed_org_ids ?? []).length} точек</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
