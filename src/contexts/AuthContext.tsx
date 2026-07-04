import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Role = 'HEADMASTER' | 'TEACHER' | 'STUDENT'

export interface AuthUser {
  id: number
  username: string
  role: Role
  name?: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('edugov_token')
    const storedUser = localStorage.getItem('edugov_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const json = await res.json()

    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Login failed')
    }

    const { token: jwt, user: userData } = json.data
    setToken(jwt)
    setUser(userData)
    localStorage.setItem('edugov_token', jwt)
    localStorage.setItem('edugov_user', JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('edugov_token')
    localStorage.removeItem('edugov_user')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
