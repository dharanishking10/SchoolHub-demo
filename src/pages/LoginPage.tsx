import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ROLE_DASHBOARD: Record<string, string> = {
  HEADMASTER: '/dashboard/headmaster',
  TEACHER: '/dashboard/teacher',
  STUDENT: '/dashboard/student',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, logoutReason } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(logoutReason || '')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Please enter your username and password.')
      return
    }
    setLoading(true)
    try {
      await login(username.trim(), password)
      const storedUser = JSON.parse(localStorage.getItem('edugov_user') || '{}')
      const dest = ROLE_DASHBOARD[storedUser.role] || '/dashboard/student'
      navigate(dest, { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex flex-col">
      {/* Gov Banner */}
      <div className="bg-gray-100 border-b border-gray-300 py-1.5 px-4">
        <p className="text-xs text-gray-700 font-medium max-w-7xl mx-auto">
          🏛️ An Official Government Education Portal — United States Department of Education
        </p>
      </div>

      {/* Header */}
      <header className="bg-[#003087] py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow">
            <span className="text-[#003087] font-extrabold text-lg">EC</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-xl tracking-tight leading-none">EduGov Connect</h1>
            <p className="text-blue-200 text-xs mt-0.5">U.S. Department of Education — Unified Learning Platform</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#003087] px-8 py-6">
              <h2 className="text-white text-2xl font-bold">Sign In</h2>
              <p className="text-blue-200 text-sm mt-1">Access your EduGov Connect account</p>
            </div>

            <div className="px-8 py-7">
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. GOVT_MODEL_HM"
                    className="input-field font-mono"
                    autoComplete="username"
                    autoCapitalize="characters"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                type="button"
                className="w-full py-2.5 px-4 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Shield size={16} className="text-[#003087]" />
                Sign in with PIV / CAC Card
              </button>
            </div>

            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                Need an account?{' '}
                <a href="#" className="text-[#003087] font-semibold hover:underline">Request Access</a>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center space-y-1">
            <p className="text-blue-200 text-xs">🔒 This is a U.S. Government system. Unauthorized access is prohibited.</p>
            <p className="text-blue-300 text-xs opacity-70">
              By signing in you agree to the{' '}
              <a href="#" className="underline">Terms of Use</a> and{' '}
              <a href="#" className="underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-[#002060] py-4 px-6 text-center">
        <p className="text-blue-300 text-xs">© 2026 U.S. Department of Education · EduGov Connect · All rights reserved</p>
      </footer>
    </div>
  )
}
