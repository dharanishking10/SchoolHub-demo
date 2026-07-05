import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, AlertCircle, ArrowLeft, Shield, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ROLE_DASHBOARD: Record<string, string> = {
  HEADMASTER: '/dashboard/headmaster',
  TEACHER: '/dashboard/teacher',
  STUDENT: '/dashboard/student',
}

const ROLES = [
  {
    key: 'HEADMASTER',
    label: 'Headmaster',
    tamil: 'தலைமையாசிரியர்',
    desc: 'School administration & management',
    placeholder: 'e.g. GOVT_MODEL_HM',
    color: 'from-[#7B1113] to-[#9B1B1E]',
    border: 'border-[#7B1113]',
    ring: 'focus:ring-[#7B1113]/30 focus:border-[#7B1113]',
    btnBg: 'bg-[#7B1113] hover:bg-[#9B1B1E]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h.01M15 12h.01M12 15h.01" />
        <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h2M19 12h2M12 3v2M12 19v2" />
      </svg>
    ),
    badge: 'Administration',
  },
  {
    key: 'TEACHER',
    label: 'Teacher',
    tamil: 'ஆசிரியர்',
    desc: 'Class management & academics',
    placeholder: 'e.g. teacher_murugan',
    color: 'from-[#1A4D8F] to-[#0B2447]',
    border: 'border-[#1A4D8F]',
    ring: 'focus:ring-[#1A4D8F]/30 focus:border-[#1A4D8F]',
    btnBg: 'bg-[#1A4D8F] hover:bg-[#0B2447]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth={1.5}>
        <rect x="3" y="3" width="18" height="14" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h4M7 10h6M7 13h3" />
      </svg>
    ),
    badge: 'Faculty',
  },
  {
    key: 'STUDENT',
    label: 'Student',
    tamil: 'மாணவர்',
    desc: 'Academics, attendance & more',
    placeholder: 'e.g. arjun_s001',
    color: 'from-[#1B6B3A] to-[#145229]',
    border: 'border-[#1B6B3A]',
    ring: 'focus:ring-[#1B6B3A]/30 focus:border-[#1B6B3A]',
    btnBg: 'bg-[#1B6B3A] hover:bg-[#145229]',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z" />
        <circle cx="12" cy="8" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l7 4 7-4" />
      </svg>
    ),
    badge: 'Learner',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { login, logoutReason } = useAuth()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(logoutReason || '')

  const role = ROLES.find(r => r.key === selectedRole)

  const handleSelect = (key: string) => {
    setSelectedRole(key)
    setUsername('')
    setPassword('')
    setError('')
    setShowPassword(false)
  }

  const handleBack = () => {
    setSelectedRole(null)
    setError('')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) { setError('Please enter your username and password.'); return }
    setLoading(true); setError('')
    try {
      await login(username.trim(), password)
      const stored = JSON.parse(localStorage.getItem('edugov_user') || '{}')
      navigate(ROLE_DASHBOARD[stored.role] || '/dashboard/student', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F2F5]">

      {/* India Tricolor top strip */}
      <div className="flex h-1.5">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#138808]" />
      </div>

      {/* Gov Banner */}
      <div className="bg-[#1a1a2e] border-b border-white/10 py-1 px-4">
        <p className="text-[11px] text-gray-300 font-medium max-w-6xl mx-auto text-center tracking-wide">
          🏛️ Official Portal — Government of Tamil Nadu &nbsp;|&nbsp; Department of School Education
        </p>
      </div>

      {/* Main Header */}
      <header className="bg-gradient-to-b from-[#0B2447] to-[#122d5a] shadow-xl">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center gap-3 text-center">

            {/* Tamil Nadu Government Emblem */}
            <div className="shrink-0">
              <img
                src="/tn-emblem-official.png"
                alt="Tamil Nadu Government Emblem"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-lg"
              />
            </div>

            {/* Title block */}
            <div className="text-center">
              <p className="text-[#D4AF37] text-xs sm:text-sm font-bold tracking-[0.25em] uppercase mb-0.5">
                Government of Tamil Nadu
              </p>
              <p className="text-[#D4AF37]/80 text-xs font-semibold tracking-[0.15em] uppercase mb-2">
                Department of School Education
              </p>
              <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                EduGov Connect
              </h1>
              <p className="text-blue-200 text-sm font-medium mt-1">
                Tamil Nadu Government School Management System
              </p>
              <p className="text-blue-300/60 text-xs mt-0.5">
                தமிழ்நாடு அரசு பள்ளி மேலாண்மை அமைப்பு
              </p>
            </div>
          </div>
        </div>

        {/* School name banner */}
        <div className="bg-[#D4AF37] py-3 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 text-center">
            <span className="text-[#0B2447] font-extrabold text-sm sm:text-base tracking-wider">
              GOVT MODEL HIGHER SECONDARY SCHOOL
            </span>
            <span className="hidden sm:block text-[#0B2447]/40 font-bold">|</span>
            <span className="text-[#0B2447]/80 font-bold text-sm tracking-wider">
              CHELLAMPALAYAM
            </span>
            <span className="hidden sm:block text-[#0B2447]/40 font-bold">|</span>
            <span className="text-[#0B2447]/80 font-bold text-sm tracking-wider">
              ANTHIYUR
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 py-10 px-4">
        <div className="max-w-5xl mx-auto">

          <AnimatePresence mode="wait">

            {/* ── Role Selection ── */}
            {!selectedRole && (
              <motion.div key="select"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}>

                <div className="text-center mb-8">
                  <h2 className="text-[#0B2447] text-xl font-bold">Select Your Role to Sign In</h2>
                  <p className="text-gray-500 text-sm mt-1">உங்கள் பதவியை தேர்ந்தெடுக்கவும்</p>
                  {logoutReason && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-2.5 rounded-xl">
                      <AlertCircle size={15} className="shrink-0" /> {logoutReason}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {ROLES.map((r, i) => (
                    <motion.button key={r.key}
                      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={() => handleSelect(r.key)}
                      className="group relative bg-white rounded-2xl border-2 border-gray-100 hover:border-current shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden text-left"
                      style={{ borderColor: undefined }}
                    >
                      {/* Gradient top bar */}
                      <div className={`bg-gradient-to-r ${r.color} h-1.5 w-full`} />

                      <div className="p-6">
                        {/* Icon */}
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${r.color} text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform duration-200`}>
                          {r.icon}
                        </div>

                        {/* Labels */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="text-[#0B2447] font-extrabold text-lg leading-tight">{r.label}</h3>
                            <p className="text-gray-400 text-xs font-medium">{r.tamil}</p>
                          </div>
                          <span className={`shrink-0 mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${r.color} text-white`}>
                            {r.badge}
                          </span>
                        </div>

                        <p className="text-gray-500 text-sm">{r.desc}</p>

                        {/* CTA */}
                        <div className={`mt-5 flex items-center gap-2 text-sm font-bold bg-gradient-to-r ${r.color} bg-clip-text text-transparent`}>
                          <Lock size={13} className="opacity-60" style={{ color: 'inherit' }} />
                          Sign In →
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Info strip */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                  className="mt-8 bg-white border border-gray-100 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
                  <Shield size={18} className="text-[#0B2447]/40 shrink-0" />
                  <p className="text-xs text-gray-500 text-center sm:text-left">
                    This is a secure Tamil Nadu Government portal. Unauthorised access is strictly prohibited under the IT Act, 2000.
                    All login activities are monitored and recorded.
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* ── Login Form ── */}
            {selectedRole && role && (
              <motion.div key="login"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
                className="max-w-md mx-auto">

                {/* Back */}
                <button onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0B2447] transition-colors mb-6 font-medium">
                  <ArrowLeft size={15} /> All Roles
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                  {/* Role header */}
                  <div className={`bg-gradient-to-r ${role.color} px-6 py-6`}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/15 rounded-xl flex items-center justify-center text-white">
                        {role.icon}
                      </div>
                      <div>
                        <p className="text-white/70 text-xs font-semibold tracking-widest uppercase">{role.badge}</p>
                        <h2 className="text-white font-extrabold text-2xl leading-tight">{role.label}</h2>
                        <p className="text-white/60 text-xs mt-0.5">{role.desc}</p>
                      </div>
                    </div>
                  </div>

                  {/* School tag */}
                  <div className="bg-[#D4AF37]/10 border-b border-[#D4AF37]/20 px-6 py-2.5">
                    <p className="text-[#7a5c00] text-xs font-semibold tracking-wide text-center">
                      🏫 GOVT MODEL HR. SEC. SCHOOL — CHELLAMPALAYAM, ANTHIYUR
                    </p>
                  </div>

                  {/* Form */}
                  <div className="px-6 py-6">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5 tracking-wide uppercase">
                          Username
                        </label>
                        <input
                          type="text"
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          placeholder={role.placeholder}
                          className={`input-field font-mono ${role.ring}`}
                          autoComplete="username"
                          autoCapitalize="off"
                          autoFocus
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5 tracking-wide uppercase">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`input-field pr-10 ${role.ring}`}
                            autoComplete="current-password"
                          />
                          <button type="button" onClick={() => setShowPassword(p => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {error && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                          <AlertCircle size={15} className="shrink-0 mt-0.5" />
                          <span>{error}</span>
                        </motion.div>
                      )}

                      <button type="submit" disabled={loading}
                        className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${role.btnBg} disabled:opacity-60`}>
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Signing in…
                          </>
                        ) : (
                          <>
                            <Lock size={15} />
                            Sign In as {role.label}
                          </>
                        )}
                      </button>
                    </form>

                    <p className="text-[10px] text-gray-400 text-center mt-4 leading-relaxed">
                      🔒 Secure connection · Session expires after 8 hours
                    </p>
                  </div>
                </div>

                {/* Credentials hint */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-600">
                  <p className="font-semibold mb-1">Demo credentials</p>
                  {selectedRole === 'HEADMASTER' && <p>Username: <span className="font-mono">GOVT_MODEL_HM</span> · Password: <span className="font-mono">CHELLAMPALAYAM</span></p>}
                  {selectedRole === 'TEACHER' && <p>Username: <span className="font-mono">teacher_murugan</span> · Password: <span className="font-mono">School@2026</span></p>}
                  {selectedRole === 'STUDENT' && <p>Username: <span className="font-mono">arjun_s001</span> · Password: <span className="font-mono">School@2026</span></p>}
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0B2447] mt-auto">
        <div className="border-t border-white/10 px-4 py-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center">
            <p className="text-blue-300 text-xs">
              © 2026 Government of Tamil Nadu · Department of School Education
            </p>
            <p className="text-blue-400/60 text-xs">
              EduGov Connect · All rights reserved
            </p>
          </div>
        </div>
        {/* Bottom tricolor */}
        <div className="flex h-1">
          <div className="flex-1 bg-[#FF9933]" />
          <div className="flex-1 bg-white/30" />
          <div className="flex-1 bg-[#138808]" />
        </div>
      </footer>

    </div>
  )
}
