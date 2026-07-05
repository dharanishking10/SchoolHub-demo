import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react'

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
  logout: (reason?: string) => void
  isLoading: boolean
  logoutReason: string | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

const IDLE_LIMIT_MS = 20 * 60 * 1000 // 20 minutes of inactivity
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']

function decodeJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [logoutReason, setLogoutReason] = useState<string | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const logout = useCallback((reason?: string) => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('edugov_token')
    localStorage.removeItem('edugov_user')
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
    if (reason) setLogoutReason(reason)
  }, [])

  useEffect(() => {
    const storedToken = localStorage.getItem('edugov_token')
    const storedUser = localStorage.getItem('edugov_user')
    if (storedToken && storedUser) {
      const exp = decodeJwtExp(storedToken)
      if (exp && exp < Date.now()) {
        localStorage.removeItem('edugov_token')
        localStorage.removeItem('edugov_user')
      } else {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    }
    setIsLoading(false)
  }, [])

  // Auto-logout when the JWT itself expires
  useEffect(() => {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
    if (!token) return
    const exp = decodeJwtExp(token)
    if (!exp) return
    const msRemaining = exp - Date.now()
    if (msRemaining <= 0) { logout('Your session has expired. Please sign in again.'); return }
    expiryTimerRef.current = setTimeout(() => logout('Your session has expired. Please sign in again.'), msRemaining)
    return () => { if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current) }
  }, [token, logout])

  // Auto-logout after prolonged inactivity
  useEffect(() => {
    if (!token) return

    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => logout('You were signed out due to inactivity.'), IDLE_LIMIT_MS)
    }

    resetIdleTimer()
    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetIdleTimer))
    return () => {
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetIdleTimer))
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [token, logout])

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
    setLogoutReason(null)
    setToken(jwt)
    setUser(userData)
    localStorage.setItem('edugov_token', jwt)
    localStorage.setItem('edugov_user', JSON.stringify(userData))
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, logoutReason }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
