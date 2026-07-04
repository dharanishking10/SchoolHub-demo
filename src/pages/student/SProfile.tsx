import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

interface Profile { fullName: string; admissionNumber?: string; className: string; section: string; rollNumber: string; gender: string; dateOfBirth?: string; fatherName?: string; motherName?: string; mobile?: string; address?: string; username?: string; status: string }

export default function SProfile() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setProfile(d.data.user) }).finally(() => setLoading(false))
  }, [token])

  const SECTIONS = profile ? [
    { heading: 'Academic Details', fields: [
      { label: 'Admission Number', value: profile.admissionNumber || '—' },
      { label: 'Class', value: `Std ${profile.className} – Section ${profile.section}` },
      { label: 'Roll Number', value: profile.rollNumber },
      { label: 'Status', value: profile.status },
      { label: 'Username', value: profile.username || '—' },
    ]},
    { heading: 'Personal Details', fields: [
      { label: 'Full Name', value: profile.fullName },
      { label: 'Gender', value: profile.gender },
      { label: 'Date of Birth', value: profile.dateOfBirth || '—' },
    ]},
    { heading: 'Parent & Contact', fields: [
      { label: 'Father Name', value: profile.fatherName || '—' },
      { label: 'Mother Name', value: profile.motherName || '—' },
      { label: 'Mobile', value: profile.mobile || '—' },
      { label: 'Address', value: profile.address || '—' },
    ]},
  ] : []

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">My Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your student account information</p>
      </motion.div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl border border-gov-border animate-pulse" />)}</div>
      ) : profile && (
        <>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#0B2447] rounded-2xl p-6 mb-6 flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-secondary/20 border-2 border-secondary/50 flex items-center justify-center shrink-0">
              <span className="text-secondary font-extrabold text-3xl">{profile.fullName[0]}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{profile.fullName}</h2>
              <p className="text-secondary text-sm font-semibold mt-0.5">{profile.admissionNumber}</p>
              <p className="text-white/60 text-sm">Std {profile.className} – Section {profile.section} · Roll {profile.rollNumber}</p>
              <span className={`inline-flex mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${profile.status === 'ACTIVE' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-gray-500/30 text-gray-300'}`}>{profile.status}</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {SECTIONS.map((sec, si) => (
              <motion.div key={sec.heading} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.08 }}
                className="bg-white rounded-2xl shadow-sm border border-gov-border p-5">
                <h3 className="text-xs font-bold text-[#0B2447] uppercase tracking-wider mb-4">{sec.heading}</h3>
                <div className="space-y-3">
                  {sec.fields.map(f => (
                    <div key={f.label}>
                      <p className="text-xs text-gray-400">{f.label}</p>
                      <p className="text-sm font-semibold text-gray-700 mt-0.5">{f.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
