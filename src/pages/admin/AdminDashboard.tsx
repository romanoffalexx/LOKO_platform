import { type FC, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
} from 'recharts'
import { dashboardApi } from '@/lib/api'
import {
  IconArrowUp, IconArrowDown, IconChevronDown, IconRefresh,
  IconSpark, IconShield,
} from '@/components/ui/icons'

// ─── Типы данных дашборда ────────────────────────────────────
interface DashboardData {
  orgsWithTablets: number
  orgsWithMonitors: number
  uniqueParticipants: number
  conversion: number
  trafficByDay: { day: string; label: string; spins: number; redeemed: number }[]
  topPoints: { name: string; point: string; tablet_name?: string; spins: number }[]
  offersByZone: { zone: string; count: number }[]
  networkStatus: {
    online: number
    tablets: { online: number; total: number }
  }
  recentEvents: { time: string; title: string; meta: string; status: string }[]
}

const emptyDashboard: DashboardData = {
  orgsWithTablets: 0,
  orgsWithMonitors: 0,
  uniqueParticipants: 0,
  conversion: 0,
  trafficByDay: [],
  topPoints: [],
  offersByZone: [],
  networkStatus: { online: 0, tablets: { online: 0, total: 0 } },
  recentEvents: [],
}

// ==== Карточка метрики ====
function MetricCard({
  label, value, delta, isPercent = true, accent = 'pink',
}: {
  label: string
  value: string | number
  delta?: number
  isPercent?: boolean
  accent?: 'pink' | 'violet' | 'success'
}) {
  const up = (delta ?? 0) >= 0
  const accentMap: Record<string, string> = {
    pink: 'from-loko-pink/30 to-loko-pink/0',
    violet: 'from-loko-violet/30 to-loko-violet/0',
    success: 'from-loko-success/30 to-loko-success/0',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="metric-card"
    >
      <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${accentMap[accent]} blur-2xl`} />
      <div className="relative">
        <div className="text-sm text-loko-text-secondary">{label}</div>
        <div className="mt-1 text-3xl font-bold tracking-tight text-loko-text-primary">{value}</div>
        {delta !== undefined && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={`inline-flex items-center gap-0.5 ${up ? 'text-loko-success' : 'text-loko-danger'}`}>
              {up ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />}
              {Math.abs(delta).toFixed(1)}{isPercent ? '%' : ''}
            </span>
            <span className="text-loko-text-muted">к прошлой неделе</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ==== Кастомный тултип для графика ====
const ChartTooltip: FC<{ active?: boolean; payload?: any[]; label?: string }> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-loko-bg-border bg-loko-bg-elevated/95 p-3 text-xs shadow-glow-soft backdrop-blur-xl">
      <div className="mb-1 text-loko-text-muted">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-loko-text-secondary">{p.name}:</span>
          <span className="font-semibold text-loko-text-primary">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ==== Виджет «Трафик и погашение» ====
const TrafficChart: FC<{ data: DashboardData['trafficByDay'] }> = ({ data }) => {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold text-loko-text-primary">Трафик и погашение</div>
          <div className="text-xs text-loko-text-muted">Запуски барабана / погашённые купоны</div>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-loko-bg-border bg-loko-bg-base/40 p-1 text-xs">
          {['7 дней', '30 дней', '90 дней'].map((p, i) => (
            <button key={p} className={`rounded-lg px-3 py-1.5 ${i === 0 ? 'bg-loko-bg-elevated text-loko-text-primary' : 'text-loko-text-secondary hover:text-loko-text-primary'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSpins" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity={0.65} />
                <stop offset="100%" stopColor="#A855F7" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradRedeem" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF2D6A" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#FF2D6A" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#6B5E85', fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6B5E85', fontSize: 11 }} width={28} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="spins" name="Запуски" stroke="#A855F7" strokeWidth={2} fill="url(#gradSpins)" />
            <Area type="monotone" dataKey="redeemed" name="Погашения" stroke="#FF2D6A" strokeWidth={2} fill="url(#gradRedeem)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-loko-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-loko-purple" /> Запуски
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-loko-pink" /> Погашения
        </span>
      </div>
    </div>
  )
}

// ==== Виджет «Состояние сети» ====
const NetworkStatusWidget: FC<{ data: DashboardData['networkStatus']; orgsWithMonitors: number }> = ({ data, orgsWithMonitors }) => {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-loko-text-primary">Состояние сети</div>
        <span className="badge badge-success gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-loko-success animate-pulse" />
          {data.online}% online
        </span>
      </div>
      <div className="section-title mt-1">Устройства и точки</div>

      <div className="mt-4 flex flex-col gap-3">
        {[
          { name: 'Планшеты', sub: `${data.tablets.online} устройств`, right: `${data.tablets.online} online`, badge: 'badge-success' },
          { name: 'Мониторы', sub: `${orgsWithMonitors} организаций`, right: `${orgsWithMonitors}`, badge: 'badge-violet' },
          { name: 'Точки', sub: `${data.tablets.total} всего`, right: `${data.tablets.online}`, badge: 'badge-violet' },
        ].map((r) => (
          <div key={r.name} className="card-elevated flex items-center gap-4 p-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-loko-bg-base/60 text-loko-pink">
              <IconShield size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-loko-text-primary">{r.name}</div>
              <div className="text-xs text-loko-text-muted truncate">{r.sub}</div>
            </div>
            <span className={`badge ${r.badge}`}>{r.right}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==== Топ точек по трафику ====
const TopPoints: FC<{ data: DashboardData['topPoints'] }> = ({ data }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between">
      <div className="text-base font-semibold text-loko-text-primary">Топ точек по трафику</div>
      <span className="text-xs text-loko-text-muted">за 30 дней</span>
    </div>
    <div className="mt-4 flex flex-col gap-2.5">
      {data.length === 0 && (
        <div className="py-6 text-center text-sm text-loko-text-muted">Пока нет данных</div>
      )}
      {data.map((p, idx) => (
        <div key={idx} className="card-elevated flex items-center gap-3 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-loko-bg-base/60 text-sm font-bold text-loko-pink">
            {idx + 1}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-loko-text-primary">{p.name} · {p.point}</div>
            <div className="text-xs text-loko-text-muted">{Number(p.spins).toLocaleString('ru')} запусков</div>
          </div>
          <IconChevronDown size={16} className="text-loko-text-muted -rotate-90" />
        </div>
      ))}
    </div>
  </div>
)

// ==== Акции по зонам ====
const OffersByZone: FC<{ data: DashboardData['offersByZone'] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-loko-text-primary">Акции по зонам</div>
        <span className="text-xs text-loko-text-muted">актуальные</span>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {data.length === 0 && (
          <div className="py-6 text-center text-sm text-loko-text-muted">Пока нет данных</div>
        )}
        {data.map(d => (
          <div key={d.zone} className="grid grid-cols-12 items-center gap-2 text-sm">
            <div className="col-span-3 truncate text-loko-text-secondary">{d.zone}</div>
            <div className="col-span-7">
              <div className="h-2.5 overflow-hidden rounded-full bg-loko-bg-base/60">
                <div
                  className="h-full rounded-full bg-gradient-brand shadow-glow"
                  style={{ width: `${(d.count / max) * 100}%` }}
                />
              </div>
            </div>
            <div className="col-span-2 text-right font-semibold text-loko-text-primary">{d.count}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==== Лента последних событий ====
const LiveFeed: FC<{ data: DashboardData['recentEvents'] }> = ({ data }) => {
  const statusColor: Record<string, string> = {
    issued: 'bg-loko-pink shadow-glow',
    redeemed: 'bg-loko-violet',
    expired: 'bg-loko-text-muted',
    cancelled: 'bg-loko-danger',
  }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-loko-text-primary">Последние события</div>
        <span className="badge badge-success gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-loko-success animate-pulse" />
          live
        </span>
      </div>
      <div className="mt-4 flex flex-col">
        {data.length === 0 && (
          <div className="py-6 text-center text-sm text-loko-text-muted">Событий пока нет</div>
        )}
        {data.map((e, i) => (
          <div key={i} className="grid grid-cols-12 items-start gap-3 border-l border-loko-bg-border pl-4 py-2.5 first:pt-0 relative">
            <span className={`absolute -left-[5px] top-3.5 h-2.5 w-2.5 rounded-full ${statusColor[e.status] ?? 'bg-loko-pink'}`} />
            <div className="col-span-2 text-xs text-loko-text-muted">{e.time}</div>
            <div className="col-span-10">
              <div className="text-sm text-loko-text-primary">{e.title}</div>
              <div className="text-xs text-loko-text-muted">{e.meta}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ==== Заголовок страницы ====
const PageHeader: FC<{ onRefresh: () => void; loading: boolean }> = ({ onRefresh, loading }) => (
  <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
    <div>
      <div className="text-xs text-loko-pink">{new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })} · LIVE</div>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-loko-text-primary md:text-3xl">
        Операционный центр
      </h1>
      <p className="mt-1 text-sm text-loko-text-secondary">
        Контроль трафика, участников, акций и купонов в одной системе.
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <button className="btn-outline">
        <IconSpark size={16} />
        Открыть клиентский сценарий розыгрыша
      </button>
      <div className="flex items-center gap-1 rounded-xl border border-loko-bg-border bg-loko-bg-base/40 p-1 text-sm">
        <button className="rounded-lg px-3 py-1.5 text-loko-text-primary bg-loko-bg-elevated">Сегодня</button>
        <button className="rounded-lg px-3 py-1.5 text-loko-text-secondary hover:text-loko-text-primary">Неделя</button>
        <button className="rounded-lg px-3 py-1.5 text-loko-text-secondary hover:text-loko-text-primary">Месяц</button>
        <IconChevronDown size={16} className="ml-1 mr-2 text-loko-text-muted" />
      </div>

      <button className="btn-ghost" onClick={onRefresh} disabled={loading}>
        <IconRefresh size={16} className={loading ? 'animate-spin' : ''} />
      </button>
    </div>
  </div>
)

// ==== Главный компонент дашборда ====
export function AdminDashboard() {
  const [data, setData] = useState<DashboardData>(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const json = await dashboardApi.get()
      setData(json)
    } catch (err: any) {
      console.error('[Dashboard] Ошибка загрузки:', err)
      setError(err.message ?? 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      <PageHeader onRefresh={fetchData} loading={loading} />

      {error && (
        <div className="mb-4 card border-loko-danger/30 bg-loko-danger/10 p-4 text-sm text-loko-danger">
          Ошибка: {error}. Проверьте, что бэкенд запущен (<code>npm run server</code>).
        </div>
      )}

      {/* Метрики */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Организации с планшетами" value={data.orgsWithTablets} accent="pink" />
        <MetricCard label="Организации с мониторами" value={data.orgsWithMonitors} accent="violet" />
        <MetricCard label="Уникальные участники" value={data.uniqueParticipants.toLocaleString('ru')} accent="pink" />
        <MetricCard
          label="Конверсия → погашение"
          value={`${data.conversion.toString().replace('.', ',')}%`}
          accent="success"
        />
      </div>

      {/* Графики */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2"><TrafficChart data={data.trafficByDay} /></div>
        <div><NetworkStatusWidget data={data.networkStatus} orgsWithMonitors={data.orgsWithMonitors} /></div>
      </div>

      {/* Нижние блоки */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TopPoints data={data.topPoints} />
        <OffersByZone data={data.offersByZone} />
        <LiveFeed data={data.recentEvents} />
      </div>
    </div>
  )
}
