import { useState, type FC, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { YaokoLogo } from '@/components/brand/YaokoLogo'
import { PasswordInput } from '@/components/ui/PasswordInput'

export const ChangePasswordPage: FC = () => {
  const { user, refresh } = useAuth()
  const navigate = useNavigate()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const showOld = !user?.must_change_pwd

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirm) {
      setError('Пароли не совпадают')
      return
    }
    if (newPassword.length < 6) {
      setError('Новый пароль минимум 6 символов')
      return
    }

    setLoading(true)
    try {
      await authApi.changePassword(showOld ? oldPassword : null, newPassword)
      await refresh()
      navigate(user?.role === 'admin' ? '/admin' : '/partner', { replace: true })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-loko-bg-base px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4">
          <YaokoLogo className="h-16" />
          <h1 className="text-2xl font-bold text-loko-text-primary">
            {user?.must_change_pwd ? 'Смена пароля' : 'Изменить пароль'}
          </h1>
          {user?.must_change_pwd && (
            <p className="text-sm text-loko-text-muted text-center">
              Для безопасности необходимо сменить временный пароль
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {showOld && (
            <div>
              <label className="block text-sm font-medium text-loko-text-secondary mb-1.5">Текущий пароль</label>
              <PasswordInput
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-loko-text-secondary mb-1.5">Новый пароль</label>
            <PasswordInput
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              placeholder="Минимум 6 символов"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-loko-text-secondary mb-1.5">Подтвердите пароль</label>
            <PasswordInput
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-brand w-full py-3 text-base font-semibold disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить пароль'}
          </button>
        </form>
      </div>
    </div>
  )
}
