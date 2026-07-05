import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Eye, EyeOff, Save, CheckCircle, ShieldCheck, ShieldX } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Profile { fullName: string; employeeId: string; mobile: string; email?: string; subject: string; username: string; status: string }

function getStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: '', color: '' }
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[a-z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)) score++
  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 3) return { score, label: 'Fair', color: 'bg-amber-400' }
  if (score === 4) return { score, label: 'Good', color: 'bg-blue-500' }
  return { score, label: 'Strong', color: 'bg-emerald-500' }
}

export default function TProfile() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setProfile(d.data.user) }).finally(() => setLoading(false))
  }, [token])

  const strength = getStrength(newPass)

  const handleChangePass = async () => {
    setErr('')
    if (!currentPass) { setErr('Please enter your current password'); return }
    if (!newPass) { setErr('Please enter a new password'); return }
    if (newPass.length < 8) { setErr('New password must be at least 8 characters'); return }
    if (!/[A-Z]/.test(newPass)) { setErr('New password must contain at least one uppercase letter'); return }
    if (!/[a-z]/.test(newPass)) { setErr('New password must contain at least one lowercase letter'); return }
    if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPass)) { setErr('New password must contain at least one number or special character'); return }
    if (newPass !== confirmPass) { setErr('Passwords do not match'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      })
      const json = await res.json()
      if (json.success) {
        setSaved(true)
        setCurrentPass(''); setNewPass(''); setConfirmPass('')
        setTimeout(() => setSaved(false), 3000)
      } else {
        setErr(json.message || 'Failed to change password')
      }
    } catch {
      setErr('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const INFO = profile ? [
    { label: 'Full Name', value: profile.fullName },
    { label: 'Employee ID', value: profile.employeeId },
    { label: 'Subject', value: profile.subject },
    { label: 'Mobile', value: profile.mobile },
    { label: 'Email', value: profile.email || '—' },
    { label: 'Username', value: profile.username },
    { label: 'Status', value: profile.status },
  ] : []

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">My Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your teacher account information</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          {loading ? <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            : (
              <>
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-2xl bg-[#0B2447] flex items-center justify-center shrink-0">
                    <span className="text-secondary font-extrabold text-2xl">{profile?.fullName?.[0]}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{profile?.fullName}</h2>
                    <p className="text-gray-500 text-sm">{profile?.subject} Teacher · {profile?.employeeId}</p>
                    <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${profile?.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{profile?.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {INFO.slice(0, -1).map(({ label, value }) => (
                    <div key={label} className="bg-gov-bg rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          <h2 className="text-base font-semibold text-[#0B2447] mb-4 flex items-center gap-2"><User size={17} /> Change Password</h2>
          <div className="space-y-3">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Current Password</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} value={currentPass} onChange={e => setCurrentPass(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30" />
                <button onClick={() => setShowCurrent(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                  placeholder="Min. 8 chars, upper, lower, number/symbol"
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30" />
                <button onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
              {/* Strength meter */}
              {newPass && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {strength.score >= 4
                      ? <ShieldCheck size={11} className="text-emerald-500" />
                      : <ShieldX size={11} className="text-gray-400" />}
                    <p className={`text-xs font-medium ${strength.score >= 4 ? 'text-emerald-600' : strength.score >= 3 ? 'text-amber-600' : 'text-red-500'}`}>{strength.label}</p>
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-xs text-gray-400">
                    <li className={newPass.length >= 8 ? 'text-emerald-600' : ''}>· At least 8 characters</li>
                    <li className={/[A-Z]/.test(newPass) ? 'text-emerald-600' : ''}>· One uppercase letter</li>
                    <li className={/[a-z]/.test(newPass) ? 'text-emerald-600' : ''}>· One lowercase letter</li>
                    <li className={/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPass) ? 'text-emerald-600' : ''}>· One number or special character</li>
                  </ul>
                </div>
              )}
            </div>
            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm New Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Re-enter new password"
                  className={`w-full px-3 py-2.5 pr-10 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 ${confirmPass && confirmPass !== newPass ? 'border-red-300' : 'border-gray-200'}`} />
                {confirmPass && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {confirmPass === newPass ? <CheckCircle size={14} className="text-emerald-500" /> : <span className="text-red-400 text-xs">✗</span>}
                  </span>
                )}
              </div>
            </div>
            {err && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
            <button onClick={handleChangePass} disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-[#0B2447] text-white hover:bg-[#163d6a]'} disabled:opacity-60`}>
              {saved ? <><CheckCircle size={15} /> Password Updated!</> : saving ? 'Saving…' : <><Save size={15} /> Update Password</>}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
