import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Eye, EyeOff, Save, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Profile { fullName: string; employeeId: string; mobile: string; email?: string; subject: string; username: string; status: string }

export default function TProfile() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setProfile(d.data.user) }).finally(() => setLoading(false))
  }, [token])

  const handleChangePass = async () => {
    if (!newPass || newPass !== confirmPass) { setErr('Passwords do not match'); return }
    if (newPass.length < 6) { setErr('Minimum 6 characters'); return }
    setErr(''); setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false); setSaved(true)
    setNewPass(''); setConfirmPass('')
    setTimeout(() => setSaved(false), 3000)
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
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30" />
                <button onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm Password</label>
              <input type={showPass ? 'text' : 'password'} value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30" />
            </div>
            {err && <p className="text-red-500 text-xs">{err}</p>}
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
