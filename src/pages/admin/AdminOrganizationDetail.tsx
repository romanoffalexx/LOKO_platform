import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { organizationsApi, offersApi } from '@/lib/api'
import {
  IconPhone, IconMail, IconPin, IconShield, IconTablet, IconChevronRight,
  IconCheck, IconPlus, IconDownload,
} from '@/components/ui/icons'

export function AdminOrganizationDetail() {
  const { id } = useParams()
  const [org, setOrg] = useState<any>(null)
  const [orgOffers, setOrgOffers] = useState<any[]>([])
  const [allOffers, setAllOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      organizationsApi.get(id),
      offersApi.list(),
    ]).then(([orgData, offersData]) => {
      setOrg(orgData)
      setOrgOffers(offersData.filter((o: any) => o.organization_id === id))
      setAllOffers(offersData)
    }).catch(err => console.error('[OrgDetail]', err))
      .finally(() => setLoading(false))
  }, [id])

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
              className="flex h-20 w-20 items-center justify-center rounded-3xl text-2xl font-bold text-white shadow-glow-soft"
              style={{ background: `linear-gradient(135deg, ${org.logo_color ?? '#A855F7'} 0%, #A855F7 100%)` }}
            >
              {org.logo || org.name[0]}
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
                <span>· Зона: {org.zone}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost"><IconDownload size={16} />Экспорт</button>
            <button className="btn-outline"><IconPlus size={16} />Точка</button>
            <button className="btn-brand"><IconPlus size={16} />Акция</button>
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

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Свои акции */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-base font-semibold text-loko-text-primary">Свои акции</div>
            <button className="btn-outline px-3 py-1.5 text-xs"><IconPlus size={14} />Создать</button>
          </div>
          <div className="flex flex-col gap-2">
            {orgOffers.length === 0 && (
              <div className="rounded-xl border border-dashed border-loko-bg-border p-6 text-center text-sm text-loko-text-muted">
                У организации пока нет своих акций
              </div>
            )}
            {orgOffers.map(o => (
              <Link to={`/admin/offers/${o.id}`} key={o.id} className="card-elevated group flex items-center gap-3 p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: o.bg_gradient }}>
                  {o.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-loko-text-primary">{o.title}</div>
                  <div className="text-xs text-loko-text-muted">
                    {o.starts_at?.slice(0, 10)} → {o.ends_at?.slice(0, 10)} · {o.total_issued} выдано · {o.total_redeemed} погашено
                  </div>
                </div>
                <span className={`badge ${o.status === 'active' ? 'badge-success' : o.status === 'scheduled' ? 'badge-violet' : 'badge-neutral'}`}>
                  {o.status === 'active' ? 'идёт' : o.status === 'scheduled' ? 'скоро' : 'архив'}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Разрешённые чужие акции */}
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
                  <input type="checkbox" defaultChecked={checked} className="peer sr-only" />
                  <span className="flex h-5 w-5 items-center justify-center rounded-md border border-loko-bg-border bg-loko-bg-base/60 peer-checked:border-loko-pink peer-checked:bg-gradient-brand">
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

      {/* Подсказка о безопасности */}
      <div className="mt-4 card flex items-center gap-3 border-loko-pink/30 bg-loko-pink/5 p-4 text-sm text-loko-text-secondary">
        <IconShield size={18} className="text-loko-pink" />
        <span>Доступ к общей клиентской базе партнёру не предоставляется — только лиды по акциям организации.</span>
      </div>
    </div>
  )
}
