import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { offersApi, pointOffersApi, pointsApi } from '@/lib/api'
import {
  IconPhone, IconMail, IconPin, IconShield, IconTablet, IconChevronRight,
  IconCheck, IconPlus, IconClose, IconGift,
} from '@/components/ui/icons'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

export function AdminOfferDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [offer, setOffer] = useState<any>(null)
  const [points, setPoints] = useState<any[]>([])
  const [pointOffers, setPointOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddPoint, setShowAddPoint] = useState(false)
  const [selectedPointId, setSelectedPointId] = useState('')
  const [maxCount, setMaxCount] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteOffer, setDeleteOffer] = useState(false)

  const reload = () => {
    if (!id) return
    Promise.all([
      offersApi.get(id),
      pointsApi.list(),
      pointOffersApi.list(),
    ]).then(([offerData, pointsData, poData]) => {
      setOffer(offerData)
      // Только точки организации, которой принадлежит акция
      setPoints(pointsData.filter(p => p.organization_id === offerData.organization_id))
      setPointOffers(poData.filter(po => po.offer_id === id))
    }).catch(err => console.error('[OfferDetail]', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { reload() }, [id])

  const handleAddPoint = async () => {
    if (!selectedPointId || !id) return
    setSaving(true)
    try {
      await pointOffersApi.create({
        point_id: selectedPointId,
        offer_id: id,
        max_count: maxCount ? Number(maxCount) : null,
      })
      setShowAddPoint(false)
      setSelectedPointId('')
      setMaxCount('')
      reload()
    } catch (err) {
      console.error('[PointOffers create]', err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (poId: string, isActive: boolean) => {
    try {
      await pointOffersApi.update(poId, { is_active: !isActive })
      reload()
    } catch (err) {
      console.error('[PointOffers toggle]', err)
    }
  }

  const handleDeletePo = async (poId: string) => {
    try {
      await pointOffersApi.delete(poId)
      reload()
    } catch (err) {
      console.error('[PointOffers delete]', err)
    }
  }

  const handleDeleteOffer = async () => {
    if (!id) return
    setSaving(true)
    try {
      await offersApi.delete(id)
      setDeleteOffer(false)
      navigate('/admin/offers')
    } catch (err) {
      console.error('[Offer delete]', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-loko-text-muted">Загрузка…</div>
  if (!offer) return <div className="py-12 text-center text-loko-danger">Акция не найдена</div>

  // Точки, ещё не привязанные к этой акции
  const boundPointIds = new Set(pointOffers.map(po => po.point_id))
  const availablePoints = points.filter(p => !boundPointIds.has(p.id))

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-loko-text-secondary">
        <Link to="/admin/offers" className="hover:text-loko-text-primary">Акции</Link>
        <IconChevronRight size={14} />
        <span className="text-loko-text-primary">{offer.title}</span>
      </div>

      {/* Hero-карточка акции */}
      <div className="card-elevated relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-gradient-brand opacity-25 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-3xl text-3xl shadow-glow-soft"
              style={{ background: offer.bg_gradient }}
            >
              {offer.emoji}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">{offer.title}</h1>
              <div className="mt-1 text-sm text-loko-text-secondary">{offer.organization_name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-loko-text-muted">
                <span>Период: {offer.starts_at?.slice(0, 10)} → {offer.ends_at?.slice(0, 10)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`badge ${offer.status === 'active' ? 'badge-success' : offer.status === 'scheduled' ? 'badge-violet' : 'badge-neutral'}`}>
              {offer.status === 'active' ? 'идёт' : offer.status === 'scheduled' ? 'запланирована' : 'архив'}
            </span>
            <button
              onClick={() => setDeleteOffer(true)}
              className="text-loko-text-muted transition-colors hover:text-loko-danger"
              title="Удалить акцию"
            >
              <IconClose size={20} />
            </button>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { label: 'Выдано купонов', value: offer.total_issued ?? 0 },
            { label: 'Погашено', value: offer.total_redeemed ?? 0 },
            { label: 'Привязано точек', value: pointOffers.length },
          ].map(m => (
            <div key={m.label} className="rounded-2xl border border-loko-bg-border bg-loko-bg-base/40 p-4">
              <div className="text-[10px] uppercase tracking-wider text-loko-text-muted">{m.label}</div>
              <div className="mt-1 text-xl font-bold text-loko-text-primary">{m.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Описание */}
      {offer.description && (
        <div className="card mt-4 p-5">
          <h3 className="text-base font-semibold text-loko-text-primary mb-2">Описание</h3>
          <p className="text-sm text-loko-text-secondary">{offer.description}</p>
        </div>
      )}

      {/* Point Offers — точки, где показывается эта акция */}
      <div className="card mt-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-loko-text-primary">Привязка к точкам</h3>
            <span className="text-xs text-loko-text-muted">{pointOffers.length} точек</span>
          </div>
          <button onClick={() => setShowAddPoint(true)} className="btn-outline px-3 py-1.5 text-xs">
            <IconPlus size={14} />Привязать точку
          </button>
        </div>

        {showAddPoint && (
          <div className="mb-4 card-elevated p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-loko-text-muted mb-1">Точка *</label>
                <select value={selectedPointId} onChange={e => setSelectedPointId(e.target.value)} className="input w-full">
                  <option value="">Выберите точку…</option>
                  {availablePoints.map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.org_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-loko-text-muted mb-1">Лимит (пусто = ∞)</label>
                <input
                  type="number"
                  value={maxCount}
                  onChange={e => setMaxCount(e.target.value)}
                  className="input w-full"
                  placeholder="100"
                  min="1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleAddPoint} disabled={saving || !selectedPointId} className="btn-brand disabled:opacity-50">
                {saving ? 'Привязка…' : 'Привязать'}
              </button>
              <button onClick={() => { setShowAddPoint(false); setSelectedPointId(''); setMaxCount('') }} className="btn-ghost">Отмена</button>
            </div>
          </div>
        )}

        {pointOffers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-loko-bg-border p-6 text-center text-sm text-loko-text-muted">
            Акция не привязана ни к одной точке
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pointOffers.map(po => (
              <div key={po.id} className="card-elevated flex items-center gap-3 p-3">
                <IconPin size={18} className="text-loko-pink shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-loko-text-primary">{po.point_name}</div>
                  <div className="flex items-center gap-2 text-xs text-loko-text-muted">
                    <span>{po.org_name}</span>
                    {po.max_count != null && <span>· лимит {po.issued_count ?? 0}/{po.max_count}</span>}
                    {po.max_count == null && <span>· без лимита</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(po.id, po.is_active)}
                  className={`badge cursor-pointer ${po.is_active ? 'badge-success' : 'badge-neutral'}`}
                >
                  {po.is_active ? 'активна' : 'выкл'}
                </button>
                <button
                  onClick={() => handleDeletePo(po.id)}
                  className="text-loko-text-muted hover:text-loko-danger"
                  title="Удалить привязку"
                >
                  <IconClose size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Подсказка */}
      <div className="mt-4 card flex items-center gap-3 border-loko-pink/30 bg-loko-pink/5 p-4 text-sm text-loko-text-secondary">
        <IconShield size={18} className="text-loko-pink" />
        <span>Акция автоматически доступна на всех точках организации, которая её создала. Привязка к точке задаёт лимит выдач на конкретной точке.</span>
      </div>

      {/* Подтверждение удаления акции */}
      <ConfirmDialog
        open={deleteOffer}
        message={`Акция «${offer.title}» и все связанные данные будут удалены безвозвратно.`}
        onConfirm={handleDeleteOffer}
        onCancel={() => setDeleteOffer(false)}
      />
    </div>
  )
}
