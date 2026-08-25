import { IconClose } from '@/components/ui/icons'

interface ConfirmDialogProps {
  open: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

/** Модальное подтверждение удаления: «Вы уверены, что хотите удалить?» Да / Нет */
export function ConfirmDialog({ open, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div className="card mx-4 w-full max-w-sm space-y-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-loko-danger/10 text-loko-danger">
            <IconClose size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-loko-text-primary">Вы уверены, что хотите удалить?</h3>
            <p className="mt-0.5 text-sm text-loko-text-muted">{message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-loko-danger px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Да
          </button>
          <button onClick={onCancel} className="btn-ghost flex-1">Нет</button>
        </div>
      </div>
    </div>
  )
}
