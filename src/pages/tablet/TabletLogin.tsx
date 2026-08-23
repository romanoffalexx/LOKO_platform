import { useState, type FC, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { tabletAuthApi } from '@/lib/api'
import { motion } from 'framer-motion'
import { IconLogo } from '@/components/ui/icons'

export const TabletLogin: FC = () => {
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await tabletAuthApi.login(login, password)
      // Сохраняем данные планшета в sessionStorage
      sessionStorage.setItem('loko_tablet', JSON.stringify(result))
      navigate('/tablet/welcome')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex flex-1 flex-col items-center justify-center"
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <IconLogo size={40} />
          <h1 className="text-2xl font-bold text-loko-text-primary">Авторизация планшета</h1>
          <p className="text-sm text-loko-text-muted text-center">Введите логин и пароль, выданные администратором</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-loko-text-secondary mb-1.5">Логин</label>
            <input
              type="text"
              value={login}
              onChange={e => setLogin(e.target.value)}
              required
              className="input w-full text-center text-lg tracking-wider"
              placeholder="partner-t1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-loko-text-secondary mb-1.5">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="input w-full text-center text-lg"
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-brand w-full py-4 text-base font-semibold disabled:opacity-50"
          >
            {loading ? 'Подключение...' : 'Войти'}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
