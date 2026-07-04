import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, BookOpen, Shield, Users } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<'student' | 'educator' | 'admin'>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    navigate('/dashboard')
  }

  const roles = [
    { id: 'student', label: 'Student', icon: BookOpen },
    { id: 'educator', label: 'Educator', icon: Users },
    { id: 'admin', label: 'Admin', icon: Shield },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex flex-col">
      {/* Gov Banner */}
      <div className="bg-gray-100 border-b border-gray-300 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <span className="text-xs text-gray-700 font-medium">
            🏛️ An Official Government Education Portal — United States Department of Education
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-[#003087] py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow">
              <span className="text-[#003087] font-extrabold text-lg">EC</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight leading-none">EduGov Connect</h1>
              <p className="text-blue-200 text-xs mt-0.5">U.S. Department of Education — Unified Learning Platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-[#003087] px-8 py-6">
              <h2 className="text-white text-2xl font-bold">Sign In</h2>
              <p className="text-blue-200 text-sm mt-1">Access your EduGov Connect account</p>
            </div>

            {/* Card Body */}
            <div className="px-8 py-7">
              {/* Role Selector */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sign in as</label>
                <div className="grid grid-cols-3 gap-2">
                  {roles.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setRole(id)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border-2 text-xs font-semibold transition-all duration-150 ${
                        role === id
                          ? 'border-[#003087] bg-blue-50 text-[#003087]'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@education.gov"
                    className="input-field"
                    autoComplete="email"
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

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600" />
                    <span className="text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-[#003087] font-medium hover:underline">
                    Forgot password?
                  </a>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 mt-2"
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

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                type="button"
                className="w-full py-2.5 px-4 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors duration-150 flex items-center justify-center gap-2"
              >
                <Shield size={16} className="text-[#003087]" />
                Sign in with PIV / CAC Card
              </button>
            </div>

            {/* Card Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500">
                Need an account?{' '}
                <a href="#" className="text-[#003087] font-semibold hover:underline">
                  Request Access
                </a>
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-blue-200 text-xs">
              🔒 This is a U.S. Government system. Unauthorized access is prohibited.
            </p>
            <p className="text-blue-300 text-xs mt-1 opacity-70">
              By signing in you agree to the{' '}
              <a href="#" className="underline">Terms of Use</a> and{' '}
              <a href="#" className="underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#002060] py-4 px-6 text-center">
        <p className="text-blue-300 text-xs">
          © 2026 U.S. Department of Education · EduGov Connect · All rights reserved
        </p>
      </footer>
    </div>
  )
}
