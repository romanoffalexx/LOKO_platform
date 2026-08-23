import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export function RequireRole({ roles }: { roles: string[] }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-loko-bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-loko-pink border-t-transparent" />
          <span className="text-sm text-loko-text-muted">Проверка авторизации...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!roles.includes(user.role)) {
    // Перенаправляем на домашнюю страницу соответствующей роли
    const roleHome: Record<string, string> = {
      admin: '/admin',
      partner: '/partner',
      tablet: '/tablet/welcome',
    }
    return <Navigate to={roleHome[user.role] || '/'} replace />
  }

  return <Outlet />
}
