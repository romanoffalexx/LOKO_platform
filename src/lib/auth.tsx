import { createContext, useContext, useState, useEffect, useCallback, type FC, type ReactNode } from 'react'
import { authApi } from './api'

interface AuthUser {
  id: string
  email: string
  role: string
  name: string
  organization_id?: string
  organization_name?: string
  must_change_pwd?: boolean
  telegram_chat_id?: string
  telegram_username?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { throw new Error('Not implemented') },
  logout: async () => {},
  refresh: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await authApi.me()
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await authApi.login(email, password)
    setUser(res.user)
    return res.user
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
