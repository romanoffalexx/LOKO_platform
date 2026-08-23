// Mock-данные для прототипа ЯОКО
import type {
  Organization, Offer, Coupon, Participant,
  Tablet, Screen, GeoZone, Lead, Notification,
} from '@/types'

export const organizations: Organization[] = [
  {
    id: 'org-1',
    name: 'ТРЦ «Северный»',
    logo: 'С',
    logoColor: '#FF2D6A',
    address: 'ул. Северная, 42',
    zone: 'Центр',
    hasTablet: true,
    participatesInOffers: true,
    phone: '+7 (861) 200-12-34',
    email: 'info@severniy.ru',
    activeOffers: 3,
    totalLeads: 2814,
    totalRedeemed: 612,
    createdAt: '2026-01-15',
  },
  {
    id: 'org-2',
    name: '«Вкусный Дом»',
    logo: 'В',
    logoColor: '#A855F7',
    address: 'Западный обход, 17',
    zone: 'Западный обход',
    hasTablet: true,
    participatesInOffers: true,
    phone: '+7 (861) 277-44-12',
    email: 'hello@vkus-dom.ru',
    activeOffers: 2,
    totalLeads: 2306,
    totalRedeemed: 488,
    createdAt: '2026-02-04',
  },
  {
    id: 'org-3',
    name: '«МегаМаркет»',
    logo: 'М',
    logoColor: '#7C3AED',
    address: 'ул. Ставропольская, 231',
    zone: 'Центр',
    hasTablet: true,
    participatesInOffers: false,
    phone: '+7 (861) 210-00-31',
    email: 'office@megamarket.ru',
    activeOffers: 0,
    totalLeads: 1964,
    totalRedeemed: 0,
    createdAt: '2026-02-22',
  },
  {
    id: 'org-4',
    name: 'Кофейня «Луч»',
    logo: 'Л',
    logoColor: '#F59E0B',
    address: 'ул. Красная, 88',
    zone: 'Центр',
    hasTablet: true,
    participatesInOffers: true,
    phone: '+7 (861) 244-09-21',
    email: 'team@luch.cafe',
    activeOffers: 4,
    totalLeads: 1742,
    totalRedeemed: 540,
    createdAt: '2026-03-01',
  },
  {
    id: 'org-5',
    name: 'Студия «Атмосфера»',
    logo: 'А',
    logoColor: '#10B981',
    address: 'пр-т Чекистов, 9',
    zone: 'Юбилейный',
    hasTablet: false,
    participatesInOffers: true,
    phone: '+7 (861) 220-44-09',
    email: 'hi@atmosfera.studio',
    activeOffers: 2,
    totalLeads: 1108,
    totalRedeemed: 312,
    createdAt: '2026-03-18',
  },
  {
    id: 'org-6',
    name: 'Пиццерия «Огонь»',
    logo: 'О',
    logoColor: '#EF4444',
    address: 'Западный обход, 51',
    zone: 'Западный обход',
    hasTablet: true,
    participatesInOffers: true,
    phone: '+7 (861) 233-77-12',
    email: 'order@ogonpizza.ru',
    activeOffers: 2,
    totalLeads: 940,
    totalRedeemed: 198,
    createdAt: '2026-04-05',
  },
  {
    id: 'org-7',
    name: 'Спортзал «Восход»',
    logo: 'В',
    logoColor: '#22D3EE',
    address: 'ул. 40 лет Победы, 12',
    zone: 'Гидрострой',
    hasTablet: true,
    participatesInOffers: false,
    phone: '+7 (861) 222-66-01',
    email: 'admin@voshod.fit',
    activeOffers: 0,
    totalLeads: 612,
    totalRedeemed: 0,
    createdAt: '2026-04-20',
  },
]

const now = new Date('2026-08-20T14:42:00')
const addDays = (d: number) => new Date(now.getTime() + d * 24 * 3600 * 1000).toISOString()

export const offers: Offer[] = [
  {
    id: 'off-1',
    title: '-20% на любой кофе',
    organizationId: 'org-4',
    organizationName: 'Кофейня «Луч»',
    description: 'Скидка действует на весь ассортимент кофейных напитков. Один купон — один клиент.',
    emoji: '☕',
    bgGradient: 'linear-gradient(135deg, #FF2D6A 0%, #A855F7 100%)',
    startsAt: '2026-08-12T09:00:00',
    endsAt: '2026-08-22T22:00:00',
    weight: 50,
    zone: 'Центр',
    allowedOrgIds: ['org-1', 'org-3', 'org-4'],
    status: 'active',
    totalIssued: 412,
    totalRedeemed: 122,
  },
  {
    id: 'off-2',
    title: 'Второй десерт бесплатно',
    organizationId: 'org-2',
    organizationName: '«Вкусный Дом»',
    description: 'При покупке любого десерта — второй в подарок. Акция действует во всех точках сети.',
    emoji: '🍰',
    bgGradient: 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
    startsAt: '2026-08-15T10:00:00',
    endsAt: '2026-08-30T23:59:00',
    weight: 35,
    zone: 'Западный обход',
    allowedOrgIds: ['org-1', 'org-2', 'org-4', 'org-6'],
    status: 'active',
    totalIssued: 318,
    totalRedeemed: 88,
  },
  {
    id: 'off-3',
    title: 'Бесплатный час в студии',
    organizationId: 'org-5',
    organizationName: 'Студия «Атмосфера»',
    description: 'Подарочный час аренды любой студии. Только по предварительной записи.',
    emoji: '🎬',
    bgGradient: 'linear-gradient(135deg, #10B981 0%, #22D3EE 100%)',
    startsAt: '2026-08-18T12:00:00',
    endsAt: '2026-09-01T22:00:00',
    weight: 20,
    zone: 'Юбилейный',
    allowedOrgIds: ['org-1', 'org-5'],
    status: 'active',
    totalIssued: 86,
    totalRedeemed: 22,
  },
  {
    id: 'off-4',
    title: 'Пицца 2 по цене 1',
    organizationId: 'org-6',
    organizationName: 'Пиццерия «Огонь»',
    description: 'Закажи две пиццы — вторую среднего размера мы приготовим бесплатно.',
    emoji: '🍕',
    bgGradient: 'linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)',
    startsAt: '2026-08-19T11:00:00',
    endsAt: '2026-08-25T23:00:00',
    weight: 30,
    zone: 'Западный обход',
    allowedOrgIds: ['org-1', 'org-2', 'org-6'],
    status: 'active',
    totalIssued: 154,
    totalRedeemed: 41,
  },
  {
    id: 'off-5',
    title: 'Бесплатный напиток к заказу',
    organizationId: 'org-1',
    organizationName: 'ТРЦ «Северный»',
    description: 'Любой холодный напиток в подарок к заказу от 1000 ₽ в фудкорте.',
    emoji: '🥤',
    bgGradient: 'linear-gradient(135deg, #7C3AED 0%, #FF2D6A 100%)',
    startsAt: '2026-08-22T10:00:00',
    endsAt: '2026-09-05T22:00:00',
    weight: 25,
    zone: 'Центр',
    allowedOrgIds: ['org-1', 'org-3', 'org-4'],
    status: 'scheduled',
    totalIssued: 0,
    totalRedeemed: 0,
  },
  {
    id: 'off-6',
    title: 'Скидка 15% на меню',
    organizationId: 'org-2',
    organizationName: '«Вкусный Дом»',
    description: 'Архивная акция июля.',
    emoji: '🍔',
    bgGradient: 'linear-gradient(135deg, #A855F7 0%, #FF2D6A 100%)',
    startsAt: '2026-07-01T10:00:00',
    endsAt: '2026-07-31T22:00:00',
    weight: 15,
    zone: 'Западный обход',
    allowedOrgIds: ['org-1', 'org-2'],
    status: 'expired',
    totalIssued: 220,
    totalRedeemed: 64,
  },
]

const couponStatuses: { status: 'issued' | 'redeemed' | 'expired'; weight: number }[] = [
  { status: 'issued', weight: 6 },
  { status: 'redeemed', weight: 3 },
  { status: 'expired', weight: 1 },
]

function pickStatus(): 'issued' | 'redeemed' | 'expired' {
  const r = Math.random() * 10
  let acc = 0
  for (const c of couponStatuses) {
    acc += c.weight
    if (r <= acc) return c.status
  }
  return 'issued'
}

const firstNames = ['Анна', 'Михаил', 'Светлана', 'Дмитрий', 'Елена', 'Игорь', 'Ольга', 'Сергей', 'Юлия', 'Артём', 'Наталья', 'Кирилл', 'Мария', 'Иван', 'Татьяна']
const lastNames = ['Иванова', 'Петров', 'Соколова', 'Кузнецов', 'Попова', 'Морозов', 'Волкова', 'Соколов', 'Лебедева', 'Козлов', 'Новикова', 'Михайлов', 'Захарова']
const tabNames = ['Т-042', 'Т-017', 'Т-031', 'Т-008', 'Т-052', 'Т-014']
const points = ['Касса 1', 'Касса 2', 'Зона выдачи', 'Холл 2 этаж', 'Вход']
const zones = ['Центр', 'Западный обход', 'Юбилейный', 'Гидрострой']

function makePhone(): string {
  const k = (n: number) => Math.floor(10 + Math.random() * 90)
  return `+7 (9${k(0)}) ${k(0)}${k(0)}${k(0)}-${k(0)}${k(0)}-${k(0)}${k(0)}`
}

export const coupons: Coupon[] = Array.from({ length: 32 }).map((_, i) => {
  const offer = offers[Math.floor(Math.random() * offers.length)]
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)]
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)]
  const status = pickStatus()
  const issued = new Date(now.getTime() - Math.floor(Math.random() * 14) * 24 * 3600 * 1000)
  const expires = new Date(issued.getTime() + 7 * 24 * 3600 * 1000)
  return {
    id: `cpn-${i + 1}`,
    code: `LOKO-${(1000 + i).toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    userId: `u-${i}`,
    userName: `${fn} ${ln}`,
    userPhone: makePhone(),
    offerId: offer.id,
    offerTitle: offer.title,
    organizationId: offer.organizationId,
    organizationName: offer.organizationName,
    address: organizations.find(o => o.id === offer.organizationId)?.address ?? '—',
    source: {
      tabletId: `tab-${Math.floor(Math.random() * 6) + 1}`,
      tabletName: tabNames[Math.floor(Math.random() * tabNames.length)],
      point: points[Math.floor(Math.random() * points.length)],
      zone: zones[Math.floor(Math.random() * zones.length)],
    },
    status,
    issuedAt: issued.toISOString(),
    expiresAt: expires.toISOString(),
    redeemedAt: status === 'redeemed' ? new Date(issued.getTime() + 2 * 24 * 3600 * 1000).toISOString() : undefined,
    redeemedBy: status === 'redeemed' ? 'Сотрудник: Анна К.' : undefined,
  }
})

export const participants: Participant[] = Array.from({ length: 28 }).map((_, i) => {
  const fn = firstNames[Math.floor(Math.random() * firstNames.length)]
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)]
  const part = 1 + Math.floor(Math.random() * 6)
  const wins = Math.floor(part * (0.4 + Math.random() * 0.5))
  return {
    id: `u-${i}`,
    name: `${fn} ${ln}`,
    phone: makePhone(),
    createdAt: addDays(-Math.floor(Math.random() * 90)),
    totalParticipations: part,
    totalWins: wins,
    consents: { pdn: true, marketing: Math.random() > 0.5, pdnAt: addDays(-Math.floor(Math.random() * 60)) },
    source: ['ТРЦ Северный', 'Вкусный Дом', 'Кофейня Луч', 'Пиццерия Огонь'][Math.floor(Math.random() * 4)],
  }
})

export const tablets: Tablet[] = Array.from({ length: 16 }).map((_, i) => {
  const o = organizations[Math.floor(Math.random() * organizations.length)]
  const status: 'online' | 'offline' | 'issue' = i === 3 ? 'issue' : i === 7 ? 'offline' : 'online'
  return {
    id: `tab-${i + 1}`,
    name: tabNames[i % tabNames.length],
    serial: `SN-${(2400000 + i * 137).toString(16).toUpperCase()}`,
    organizationId: o.id,
    organizationName: o.name,
    point: points[Math.floor(Math.random() * points.length)],
    zone: o.zone,
    status,
    lastSeen: status === 'online' ? new Date(now.getTime() - Math.random() * 60000).toISOString() : new Date(now.getTime() - 3600000 * (status === 'offline' ? 4 : 1)).toISOString(),
    appVersion: '1.4.2',
  }
})

export const screens: Screen[] = Array.from({ length: 8 }).map((_, i) => {
  const o = organizations[Math.floor(Math.random() * organizations.length)]
  return {
    id: `scr-${i + 1}`,
    name: `Монитор ${i + 1}`,
    organizationId: o.id,
    organizationName: o.name,
    point: points[Math.floor(Math.random() * points.length)],
    content: ['Меню акций', 'Летняя распродажа', 'Кофейная карта', 'Новинки недели'][i % 4],
    status: i === 6 ? 'error' : i === 4 ? 'paused' : 'active',
    startsAt: addDays(-10),
    endsAt: addDays(20),
  }
})

export const geoZones: GeoZone[] = [
  { id: 'z-1', city: 'Краснодар', name: 'Центр', organizationsCount: 12, tabletsCount: 28, offersCount: 6 },
  { id: 'z-2', city: 'Краснодар', name: 'Западный обход', sector: 'A', organizationsCount: 6, tabletsCount: 14, offersCount: 4 },
  { id: 'z-3', city: 'Краснодар', name: 'Западный обход', sector: 'B', organizationsCount: 4, tabletsCount: 9, offersCount: 3 },
  { id: 'z-4', city: 'Краснодар', name: 'Юбилейный', organizationsCount: 8, tabletsCount: 12, offersCount: 5 },
  { id: 'z-5', city: 'Краснодар', name: 'Гидрострой', organizationsCount: 5, tabletsCount: 7, offersCount: 2 },
  { id: 'z-6', city: 'Краснодар', name: 'Музыкальный микрорайон', organizationsCount: 7, tabletsCount: 10, offersCount: 3 },
  { id: 'z-7', city: 'Краснодар', name: 'РИП', organizationsCount: 3, tabletsCount: 6, offersCount: 1 },
  { id: 'z-8', city: 'Краснодар', name: 'Фестивальный микрорайон', organizationsCount: 4, tabletsCount: 8, offersCount: 2 },
]

export const leads: Lead[] = coupons.slice(0, 18).map((c, i) => ({
  id: `lead-${i + 1}`,
  couponId: c.id,
  clientName: c.userName,
  clientPhone: c.userPhone,
  offerTitle: c.offerTitle,
  organizationId: c.organizationId,
  source: { tablet: c.source.tabletName, point: c.source.point, zone: c.source.zone },
  createdAt: c.issuedAt,
  contacted: i % 3 === 0,
  redeemed: c.status === 'redeemed',
}))

export const notifications: Notification[] = [
  { id: 'n-1', channel: 'max', event: 'Выигрыш акции «-20% на кофе»', recipient: 'Кофейня «Луч»', status: 'delivered', createdAt: addDays(0) },
  { id: 'n-2', channel: 'email', event: 'Новая заявка партнёра', recipient: 'admin@loko.ru', status: 'delivered', createdAt: addDays(0) },
  { id: 'n-3', channel: 'max', event: 'Погашение купона', recipient: '«Вкусный Дом»', status: 'delivered', createdAt: addDays(-1) },
  { id: 'n-4', channel: 'email', event: 'Системное предупреждение: планшет оффлайн', recipient: 'admin@loko.ru', status: 'pending', createdAt: addDays(0) },
  { id: 'n-5', channel: 'max', event: 'Выигрыш акции «Пицца 2 по цене 1»', recipient: 'Пиццерия «Огонь»', status: 'failed', createdAt: addDays(-1) },
]

// ==== Сводная статистика для дашборда ====
export const dashboardStats = {
  orgsWithTablets: 48,
  orgsWithTabletsDelta: 8.2,
  orgsWithMonitors: 31,
  orgsWithMonitorsDelta: 4,
  uniqueParticipants: 12846,
  uniqueParticipantsDelta: 18.7,
  conversion: 27.4,
  conversionDelta: 3.1,
}

export const trafficByDay = [
  { day: '12', label: '12 авг', spins: 182, redeemed: 41 },
  { day: '13', label: '13 авг', spins: 246, redeemed: 62 },
  { day: '14', label: '14 авг', spins: 211, redeemed: 48 },
  { day: '15', label: '15 авг', spins: 308, redeemed: 88 },
  { day: '16', label: '16 авг', spins: 274, redeemed: 71 },
  { day: '17', label: '17 авг', spins: 392, redeemed: 102 },
  { day: '18', label: '18 авг', spins: 411, redeemed: 117 },
]

export const topPoints = [
  { id: 1, name: 'ТРЦ «Северный»', point: 'Касса 1', address: '#T-042', spins: 2814 },
  { id: 2, name: '«Вкусный Дом»', point: 'Зона выдачи', address: '#T-017', spins: 2306 },
  { id: 3, name: '«МегаМаркет»', point: 'Холл 2 этаж', address: '#T-031', spins: 1964 },
  { id: 4, name: 'Кофейня «Луч»', point: 'Касса 2', address: '#T-008', spins: 1742 },
  { id: 5, name: 'Студия «Атмосфера»', point: 'Вход', address: '#T-052', spins: 1108 },
]

export const offersByZone = [
  { zone: 'Центр', count: 18 },
  { zone: 'Западный обход', count: 12 },
  { zone: 'Юбилейный', count: 9 },
  { zone: 'Гидрострой', count: 6 },
  { zone: 'Фестивальный', count: 4 },
  { zone: 'Музыкальный', count: 3 },
]

export const networkStatus = {
  online: 98.7,
  tablets: { online: 84, total: 86 },
  monitors: { online: 57, total: 57, error: 0 },
  points: { active: 117, total: 117 },
}

export const recentEvents = [
  { time: '14:42', title: 'Выиграна акция «-20% на кофе»', meta: 'Планшет T-042 · Центр', kind: 'win' as const },
  { time: '14:39', title: 'Купон #LK-BF31 погашён', meta: '«Вкусный Дом»', kind: 'redeem' as const },
  { time: '14:35', title: 'Новая регистрация', meta: 'Планшет T-017', kind: 'reg' as const },
  { time: '14:28', title: 'Заявка от партнёра: Кофейня «Луч»', meta: 'Новая точка', kind: 'request' as const },
  { time: '14:21', title: 'Купон #LK-A18B истёк', meta: 'Кофейня «Луч»', kind: 'expire' as const },
  { time: '14:12', title: 'Планшет T-052 переведён в оффлайн', meta: 'Студия «Атмосфера»', kind: 'issue' as const },
]
