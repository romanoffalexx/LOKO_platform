// Базовые типы данных платформы ЯОКО по ТЗ

export type OfferStatus = 'active' | 'scheduled' | 'expired' | 'paused'
export type CouponStatus = 'issued' | 'redeemed' | 'expired' | 'cancelled'
export type TabletStatus = 'online' | 'offline' | 'issue'
export type ScreenStatus = 'active' | 'paused' | 'error'

export interface Organization {
  id: string
  name: string
  logo: string // initials/эмодзи, в реале — лого
  logoColor: string
  address: string
  zone: string
  hasTablet: boolean
  participatesInOffers: boolean
  phone: string
  email: string
  activeOffers: number
  totalLeads: number
  totalRedeemed: number
  createdAt: string
}

export interface Offer {
  id: string
  title: string
  organizationId: string
  organizationName: string
  description: string
  emoji: string
  bgGradient: string
  startsAt: string
  endsAt: string
  zone: string
  allowedOrgIds: string[]
  status: OfferStatus
  totalIssued: number
  totalRedeemed: number
}

export interface Coupon {
  id: string
  code: string
  userId: string
  userName: string
  userPhone: string
  offerId: string
  offerTitle: string
  organizationId: string
  organizationName: string
  address: string
  source: { tabletId: string; tabletName: string; point: string; zone: string }
  status: CouponStatus
  issuedAt: string
  expiresAt: string
  redeemedAt?: string
  redeemedBy?: string
}

export interface Participant {
  id: string
  name: string
  phone: string
  createdAt: string
  totalParticipations: number
  totalWins: number
  consents: { pdn: boolean; marketing: boolean; pdnAt: string }
  source: string
}

export interface Tablet {
  id: string
  name: string
  serial: string
  organizationId: string
  organizationName: string
  point: string
  zone: string
  status: TabletStatus
  lastSeen: string
  appVersion: string
}

export interface Screen {
  id: string
  name: string
  organizationId: string
  organizationName: string
  point: string
  content: string
  status: ScreenStatus
  startsAt: string
  endsAt: string
}

export interface GeoZone {
  id: string
  city: string
  name: string
  sector?: string
  organizationsCount: number
  tabletsCount: number
  offersCount: number
}

export interface Lead {
  id: string
  couponId: string
  clientName: string
  clientPhone: string
  offerTitle: string
  organizationId: string
  source: { tablet: string; point: string; zone: string }
  createdAt: string
  contacted: boolean
  redeemed: boolean
}

export interface Notification {
  id: string
  channel: 'max' | 'email'
  event: string
  recipient: string
  status: 'delivered' | 'pending' | 'failed'
  createdAt: string
}
