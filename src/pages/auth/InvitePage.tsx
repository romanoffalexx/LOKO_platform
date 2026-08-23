import { useState, type FC, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { authApi } from '@/lib/api'
import { YaokoLogo } from '@/components/brand/YaokoLogo'

export const InvitePage: FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Пароли не совпадают')
      return
    }
    if (password.length < 6) {
      setError('Пароль минимум 6 символов')
      return
    }

    setLoading(true)
    try {
      await authApi.register(token!, { email, password, name })
      setSuccess(true)
      setTimeout(() => navigate('/partner'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-loko-bg-base px-4">
        <div className="card p-8 text-center max-w-md">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-loko-text-primary mb-2">Регистрация завершена!</h2>
          <p className="text-loko-text-secondary">Перенаправляем в кабинет партнёра...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-loko-bg-base px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-4">
          <YaokoLogo className="h-16" />
          <h1 className="text-2xl font-bold text-loko-text-primary">Регистрация партнёра</h1>
          <p className="text-sm text-loko-text-muted">Заполните данные для доступа к кабинету</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-loko-text-secondary mb-1.5">Имя / Организация</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="input w-full"
              placeholder="Иван Иванов"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-loko-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input w-full"
              placeholder="partner@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-loko-text-secondary mb-1.5">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="input w-full"
              placeholder="Минимум 6 символов"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-loko-text-secondary mb-1.5">Подтвердите пароль</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="input w-full"
              placeholder="Повторите пароль"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-brand w-full py-3 text-base font-semibold disabled:opacity-50"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  )
}
