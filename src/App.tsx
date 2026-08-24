import { lazy, Suspense, type FC } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { PartnerLayout } from '@/layouts/PartnerLayout'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { InvitePage } from '@/pages/auth/InvitePage'
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage'
import { RequireRole } from '@/components/auth/RequireRole'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { AdminOrganizations } from '@/pages/admin/AdminOrganizations'
import { AdminOrganizationDetail } from '@/pages/admin/AdminOrganizationDetail'
import { AdminParticipants } from '@/pages/admin/AdminParticipants'
import { AdminOffers } from '@/pages/admin/AdminOffers'
import { AdminOfferDetail } from '@/pages/admin/AdminOfferDetail'
import { AdminCoupons } from '@/pages/admin/AdminCoupons'
import { AdminPoints } from '@/pages/admin/AdminPoints'
import { AdminTablets } from '@/pages/admin/AdminTablets'
import { AdminMonitors } from '@/pages/admin/AdminMonitors'
import { AdminGeography } from '@/pages/admin/AdminGeography'
import { AdminRequests } from '@/pages/admin/AdminRequests'
import { AdminNotifications } from '@/pages/admin/AdminNotifications'
import { AdminSettings } from '@/pages/admin/AdminSettings'
import { PartnerOverview } from '@/pages/partner/PartnerOverview'
import { PartnerLeads } from '@/pages/partner/PartnerLeads'
import { PartnerOffers } from '@/pages/partner/PartnerOffers'
import { PartnerTickets } from '@/pages/partner/PartnerTickets'
import { PartnerRedeem } from '@/pages/partner/PartnerRedeem'

// Планшетная часть — ленивая загрузка (Three.js тяжёлый)
const TabletApp = lazy(() => import('@/layouts/TabletApp'))

/** Fallback-заглушка при ленивой загрузке */
const RouteLoader: FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-loko-bg-base">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-loko-pink border-t-transparent" />
      <span className="text-sm text-loko-text-muted">Загрузка…</span>
    </div>
  </div>
)

export default function App() {
  return (
    <Routes>
      {/* Лэндинг — выбор контура */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth pages (public) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* Админ-панель — только admin */}
      <Route element={<RequireRole roles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="organizations" element={<AdminOrganizations />} />
          <Route path="organizations/:id" element={<AdminOrganizationDetail />} />
          <Route path="participants" element={<AdminParticipants />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="offers/:id" element={<AdminOfferDetail />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="points" element={<AdminPoints />} />
          <Route path="tablets" element={<AdminTablets />} />
          <Route path="monitors" element={<AdminMonitors />} />
          <Route path="geography" element={<AdminGeography />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Кабинет партнёра — partner и admin (для просмотра) */}
      <Route element={<RequireRole roles={['partner', 'admin']} />}>
        <Route path="/partner" element={<PartnerLayout />}>
          <Route index element={<PartnerOverview />} />
          <Route path="leads" element={<PartnerLeads />} />
          <Route path="offers" element={<PartnerOffers />} />
          <Route path="tickets" element={<PartnerTickets />} />
          <Route path="redeem" element={<PartnerRedeem />} />
        </Route>
      </Route>

      {/* Планшет (клиентский сценарий) — lazy */}
      <Route path="/tablet/*" element={
        <Suspense fallback={<RouteLoader />}>
          <TabletApp />
        </Suspense>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
