import { useState, type FC, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { YaokoLogo } from '@/components/brand/YaokoLogo'

export const LoginPage: FC = () => {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Если уже авторизован — редиректим
  if (user) {
    const from = (location.state as any)?.from?.pathname
    if (from) {
      navigate(from, { replace: true })
    } else {
      navigate(user.role === 'admin' ? '/admin' : user.role === 'partner' ? '/partner' : '/', { replace: true })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const u = await login(email, password)
      if (u.must_change_pwd) {
        navigate('/change-password', { replace: true })
      } else {
        const from = (location.state as any)?.from?.pathname
        if (from) {
          navigate(from, { replace: true })
        } else {
          navigate(u.role === 'admin' ? '/admin' : u.role === 'partner' ? '/partner' : '/', { replace: true })
        }
      }
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
          <Link to="/"><YaokoLogo className="h-16" /></Link>
          <h1 className="text-2xl font-bold text-loko-text-primary">Вход в систему</h1>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-loko-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input w-full"
              placeholder="admin@loko.ru"
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
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-brand w-full py-3 text-base font-semibold disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-loko-text-muted">
          Администратор создаёт доступ. Обратитесь к администратору для получения учётных данных.
        </p>
      </div>
    </div>
  )
}
