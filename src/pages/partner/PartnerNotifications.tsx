import { useState, useEffect } from 'react'
import { IconBell } from '@/components/ui/icons'

export function PartnerNotifications() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-loko-pink/10 text-loko-pink">
          <IconBell size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-loko-text-primary">Уведомления</h1>
          <p className="text-sm text-loko-text-muted">Уведомления по акциям и лидам</p>
        </div>
      </div>

      <div className="card p-6">
        <div className="rounded-xl border border-dashed border-loko-bg-border p-8 text-center">
          <IconBell size={32} className="mx-auto mb-3 text-loko-text-muted" />
          <p className="text-sm text-loko-text-muted">Уведомления будут отображаться здесь</p>
        </div>
      </div>
    </div>
  )
}
