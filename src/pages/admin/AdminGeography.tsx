import { useEffect, useState } from 'react'
import { geoZonesApi } from '@/lib/api'
import { IconPlus, IconMap, IconSearch, IconTablet, IconBuilding, IconGift } from '@/components/ui/icons'

export function AdminGeography() {
  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    geoZonesApi.list()
      .then(setZones)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-sm text-loko-text-muted">Загрузка…</div>
  if (error) return <div className="text-sm text-red-400">{error}</div>

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-loko-text-primary">География</h1>
          <p className="mt-1 text-sm text-loko-text-secondary">Ручные зоны, сектора, привязка планшетов и акций.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-loko-bg-border bg-loko-bg-surface/50 px-3 py-2 text-sm text-loko-text-muted md:w-64">
            <IconSearch size={16} />
            <input placeholder="Зона, сектор…" className="w-full bg-transparent text-loko-text-primary placeholder:text-loko-text-muted focus:outline-none" />
          </div>
          <button className="btn-brand"><IconPlus size={16} />Создать зону</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-base font-semibold text-loko-text-primary">Карта-схема зон</h3>
          <div className="relative mt-3 h-80 overflow-hidden rounded-2xl border border-loko-bg-border bg-gradient-to-br from-loko-bg-elevated to-loko-bg-base">
            <svg viewBox="0 0 600 320" className="absolute inset-0 h-full w-full">
              <defs>
                <pattern id="gridG" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M40 0 L0 0 0 40" fill="none" stroke="#2A1A45" strokeWidth="0.5" />
                </pattern>
                <linearGradient id="zoneFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FF2D6A" stopOpacity="0.4" />
                  <stop offset="1" stopColor="#A855F7" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#gridG)" />
              {[
                { id: 0, x: 40, y: 40, w: 180, h: 110 },
                { id: 1, x: 230, y: 60, w: 160, h: 90 },
                { id: 2, x: 400, y: 50, w: 170, h: 130 },
                { id: 3, x: 60, y: 170, w: 200, h: 110 },
                { id: 4, x: 280, y: 170, w: 140, h: 110 },
                { id: 5, x: 440, y: 200, w: 130, h: 80 },
              ].filter(z => zones[z.id]).map(z => (
                <g key={z.id}>
                  <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="14" fill="url(#zoneFill)" stroke="#A855F7" strokeWidth="0.8" strokeOpacity="0.4" />
                  <text x={z.x + 10} y={z.y + 22} fontSize="11" fill="#F5F0FF" fontWeight="600">
                    {zones[z.id].name}{zones[z.id].sector ? ` · ${zones[z.id].sector}` : ''}
                  </text>
                </g>
              ))}
            </svg>
            <div className="absolute bottom-3 left-3 rounded-lg border border-loko-bg-border bg-loko-bg-base/80 px-3 py-1.5 text-[10px] text-loko-text-muted">
              Стилизация, не реальная карта
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-base font-semibold text-loko-text-primary">Зоны и сектора</h3>
          <div className="mt-3 flex flex-col gap-2">
            {zones.map(z => (
              <div key={z.id} className="card-elevated p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-loko-bg-base/60 text-loko-pink">
                    <IconMap size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-loko-text-primary">
                      {z.name}{z.sector ? ` · сектор ${z.sector}` : ''}
                    </div>
                    <div className="text-xs text-loko-text-muted">{z.city}</div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="rounded-md bg-loko-bg-base/40 py-1.5">
                    <IconBuilding size={12} className="mx-auto text-loko-text-muted" />
                    <div className="mt-0.5 text-loko-text-primary">{z.organizations_count}</div>
                  </div>
                  <div className="rounded-md bg-loko-bg-base/40 py-1.5">
                    <IconTablet size={12} className="mx-auto text-loko-text-muted" />
                    <div className="mt-0.5 text-loko-text-primary">{z.tablets_count}</div>
                  </div>
                  <div className="rounded-md bg-loko-bg-base/40 py-1.5">
                    <IconGift size={12} className="mx-auto text-loko-text-muted" />
                    <div className="mt-0.5 text-loko-text-primary">{z.offers_count}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
