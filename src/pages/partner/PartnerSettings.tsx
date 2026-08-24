import { useAuth } from '@/lib/auth'
import { IconSettings, IconMail, IconPhone, IconPin } from '@/components/ui/icons'

export function PartnerSettings() {
  const { user } = useAuth()

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-loko-violet/10 text-loko-violet">
          <IconSettings size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-loko-text-primary">Настройки</h1>
          <p className="text-sm text-loko-text-muted">Профиль организации</p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-loko-text-muted mb-1">Организация</label>
          <div className="text-sm text-loko-text-primary">{user?.organization_name || '—'}</div>
        </div>
        <div>
          <label className="block text-xs font-medium text-loko-text-muted mb-1">Контактное лицо</label>
          <div className="text-sm text-loko-text-primary">{user?.name || '—'}</div>
        </div>
        <div>
          <label className="block text-xs font-medium text-loko-text-muted mb-1">Email</label>
          <div className="flex items-center gap-2 text-sm text-loko-text-primary">
            <IconMail size={14} className="text-loko-text-muted" />
            {user?.email || '—'}
          </div>
        </div>
      </div>
    </div>
  )
}
