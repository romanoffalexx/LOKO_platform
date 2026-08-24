/**
 * ЯОКО — API-клиент для фронтенда.
 * Все запросы идут на бэкенд (Express + PostgreSQL).
 *
 * Переменная окружения VITE_API_URL задаёт базовый адрес API.
 * Пример: VITE_API_URL=http://localhost:4000/api
 */

const BASE = import.meta.env.VITE_API_URL as string ?? '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (res.status === 401) {
    // Если не авторизован — редиректим на login
    if (!path.startsWith('/auth') && !window.location.pathname.startsWith('/tablet')) {
      window.location.href = '/login'
    }
    throw new Error('Необходима авторизация')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── Организации ─────────────────────────────────────────────
export const organizationsApi = {
  list: () =>
    request<any[]>('/organizations'),

  get: (id: string) =>
    request<any>(`/organizations/${id}`),

  create: (data: Record<string, any>) =>
    request<any>('/organizations', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, any>) =>
    request<any>(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/organizations/${id}`, { method: 'DELETE' }),
}

// ─── Акции ───────────────────────────────────────────────────
export const offersApi = {
  list: (status?: string) =>
    request<any[]>(`/offers${status ? `?status=${status}` : ''}`),

  get: (id: string) =>
    request<any>(`/offers/${id}`),

  create: (data: Record<string, any>) =>
    request<any>('/offers', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, any>) =>
    request<any>(`/offers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/offers/${id}`, { method: 'DELETE' }),

  /** Барабан — взвешенный выбор случайной акции */
  spin: () =>
    request<any>('/offers/spin', { method: 'POST' }),
}

// ─── Купоны ──────────────────────────────────────────────────
export const couponsApi = {
  list: (params?: { status?: string; organization_id?: string; user_id?: string; code?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.organization_id) qs.set('organization_id', params.organization_id)
    if (params?.user_id) qs.set('user_id', params.user_id)
    if (params?.code) qs.set('code', params.code)
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    const s = qs.toString()
    return request<any[]>(`/coupons${s ? `?${s}` : ''}`)
  },

  get: (id: string) =>
    request<any>(`/coupons/${id}`),

  /** Выдать купон после выигрыша */
  issue: (data: { user_id: string; offer_id: string; organization_id: string; source_tablet_id?: string; source_point?: string; source_zone?: string }) =>
    request<any>('/coupons', { method: 'POST', body: JSON.stringify(data) }),

  /** Погасить купон */
  redeem: (id: string, redeemedBy?: string) =>
    request<any>(`/coupons/${id}/redeem`, { method: 'POST', body: JSON.stringify({ redeemed_by: redeemedBy }) }),

  /** Найти купон по коду */
  findByCode: (code: string) =>
    request<any[]>(`/coupons?code=${encodeURIComponent(code)}`).then(rows => rows[0] ?? null),

  /** Отменить/заблокировать купон (только админ) */
  cancel: (id: string) =>
    request<any>(`/coupons/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) }),
}

// ─── Участники ───────────────────────────────────────────────
export const participantsApi = {
  list: (params?: { limit?: number; offset?: number; phone?: string }) => {
    const qs = new URLSearchParams()
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.offset) qs.set('offset', String(params.offset))
    if (params?.phone) qs.set('phone', params.phone)
    const s = qs.toString()
    return request<any[]>(`/participants${s ? `?${s}` : ''}`)
  },

  get: (id: string) =>
    request<any>(`/participants/${id}`),

  /** Регистрация / идентификация по телефону */
  register: (data: { name: string; phone: string; source?: string; pdn_consent?: boolean; marketing_consent?: boolean }) =>
    request<any>('/participants', { method: 'POST', body: JSON.stringify(data) }),
}

// ─── Планшеты ────────────────────────────────────────────────
export const tabletsApi = {
  list: (params?: { organization_id?: string; status?: string }) => {
    const qs = new URLSearchParams()
    if (params?.organization_id) qs.set('organization_id', params.organization_id)
    if (params?.status) qs.set('status', params.status)
    const s = qs.toString()
    return request<any[]>(`/tablets${s ? `?${s}` : ''}`)
  },

  get: (id: string) =>
    request<any>(`/tablets/${id}`),

  create: (data: Record<string, any>) =>
    request<any>('/tablets', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, any>) =>
    request<any>(`/tablets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/tablets/${id}`, { method: 'DELETE' }),
}

// ─── Лиды ─────────────────────────────────────────────────────
export const leadsApi = {
  list: (params?: { organization_id?: string; contacted?: boolean; redeemed?: boolean }) => {
    const qs = new URLSearchParams()
    if (params?.organization_id) qs.set('organization_id', params.organization_id)
    if (params?.contacted !== undefined) qs.set('contacted', String(params.contacted))
    if (params?.redeemed !== undefined) qs.set('redeemed', String(params.redeemed))
    const s = qs.toString()
    return request<any[]>(`/leads${s ? `?${s}` : ''}`)
  },

  get: (id: string) =>
    request<any>(`/leads/${id}`),

  update: (id: string, data: Record<string, any>) =>
    request<any>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// ─── Гео-зоны ─────────────────────────────────────────────────
export const geoZonesApi = {
  list: () =>
    request<any[]>('/geo-zones'),

  create: (data: Record<string, any>) =>
    request<any>('/geo-zones', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, any>) =>
    request<any>(`/geo-zones/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/geo-zones/${id}`, { method: 'DELETE' }),
}

// ─── Уведомления ─────────────────────────────────────────────
export const notificationsApi = {
  list: () =>
    request<any[]>('/notifications'),

  count: () =>
    request<{ count: number }>('/notifications/count'),

  create: (data: Record<string, any>) =>
    request<any>('/notifications', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, any>) =>
    request<any>(`/notifications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
}

// ─── Экраны / Мониторы ───────────────────────────────────────
export const screensApi = {
  list: (params?: { organization_id?: string }) => {
    const qs = new URLSearchParams()
    if (params?.organization_id) qs.set('organization_id', params.organization_id)
    const s = qs.toString()
    return request<any[]>(`/screens${s ? `?${s}` : ''}`)
  },

  get: (id: string) =>
    request<any>(`/screens/${id}`),

  create: (data: Record<string, any>) =>
    request<any>('/screens', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, any>) =>
    request<any>(`/screens/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/screens/${id}`, { method: 'DELETE' }),
}

// ─── Дашборд ─────────────────────────────────────────────────
export const dashboardApi = {
  get: (period?: 'today' | 'week' | 'month' | '7days' | '30days' | '90days') =>
    request<any>(`/dashboard${period ? `?period=${period}` : ''}`),
}

// ─── Health ──────────────────────────────────────────────────
export const healthApi = {
  check: () =>
    request<{ status: string; timestamp: string }>('/health'),
}

// ─── Auth ──────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: () =>
    request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),

  me: () =>
    request<any>('/auth/me'),

  changePassword: (oldPassword: string | null, newPassword: string) =>
    request<{ ok: boolean }>('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }),

  register: (token: string, data: { email: string; password: string; name: string }) =>
    request<any>(`/auth/register/${token}`, { method: 'POST', body: JSON.stringify(data) }),
}

// ─── Points ────────────────────────────────────────────────
export const pointsApi = {
  list: (params?: { organization_id?: string }) => {
    const qs = new URLSearchParams()
    if (params?.organization_id) qs.set('organization_id', params.organization_id)
    const s = qs.toString()
    return request<any[]>(`/points${s ? `?${s}` : ''}`)
  },

  create: (data: Record<string, any>) =>
    request<any>('/points', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, any>) =>
    request<any>(`/points/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/points/${id}`, { method: 'DELETE' }),

  createTablet: (pointId: string, data?: { password?: string }) =>
    request<any>(`/points/${pointId}/tablet`, { method: 'POST', body: JSON.stringify(data || {}) }),
}

// ─── Point Offers ──────────────────────────────────────────
export const pointOffersApi = {
  list: () =>
    request<any[]>('/point-offers'),

  create: (data: Record<string, any>) =>
    request<any>('/point-offers', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, any>) =>
    request<any>(`/point-offers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/point-offers/${id}`, { method: 'DELETE' }),
}

// ─── Invitations ───────────────────────────────────────────
export const invitationsApi = {
  list: () =>
    request<any[]>('/invitations'),

  create: (data: { email?: string; org_id: string }) =>
    request<any>('/invitations', { method: 'POST', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<{ ok: boolean }>(`/invitations/${id}`, { method: 'DELETE' }),
}

// ─── Tickets ───────────────────────────────────────────────
export const ticketsApi = {
  list: () =>
    request<any[]>('/tickets'),

  count: () =>
    request<{ count: number }>('/tickets/count'),

  create: (data: { subject: string; message: string }) =>
    request<any>('/tickets', { method: 'POST', body: JSON.stringify(data) }),

  updateStatus: (id: string, status: string) =>
    request<any>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
}



// ─── Admin Settings ────────────────────────────────────────
export const adminSettingsApi = {
  get: () =>
    request<any>('/admin/settings'),

  update: (data: Record<string, any>) =>
    request<any>('/admin/settings', { method: 'PATCH', body: JSON.stringify(data) }),
}

// ─── Tablet Auth ───────────────────────────────────────────
export const tabletAuthApi = {
  login: (login: string, password: string) =>
    request<any>('/tablet/login', { method: 'POST', body: JSON.stringify({ login, password }) }),

  spin: (name: string, phone: string) =>
    request<any>('/tablet/spin', { method: 'POST', body: JSON.stringify({ name, phone }) }),

  checkParticipation: (phone: string) =>
    request<{ participated: boolean }>('/tablet/check-participation', { method: 'POST', body: JSON.stringify({ phone }) }),
}
