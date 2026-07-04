import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { GraduationCap, Users, TrendingUp } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface StudentData {
  total: number; boys: number; girls: number
  classData: { className: string; count: number }[]
  attendance: { month: string; pct: number }[]
}

export default function StudentSummary() {
  const { token } = useAuth()
  const [data, setData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/students', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data) })
      .finally(() => setLoading(false))
  }, [token])

  const Skeleton = () => <div className="h-28 bg-white rounded-2xl border border-gov-border animate-pulse" />

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">Student Summary</h1>
        <p className="text-gray-500 text-sm mt-0.5">Overview of student enrollment and attendance</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">{[...Array(3)].map((_, i) => <Skeleton key={i} />)}</div>
      ) : data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
            {[
              { label: 'Total Students', value: data.total, icon: GraduationCap, color: 'bg-blue-50 text-blue-700' },
              { label: 'Boys', value: data.boys, icon: Users, color: 'bg-indigo-50 text-indigo-700' },
              { label: 'Girls', value: data.girls, icon: Users, color: 'bg-pink-50 text-pink-700' },
            ].map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl border border-gov-border shadow-sm p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.color}`}><c.icon size={22} /></div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                  <p className="text-3xl font-bold text-[#0B2447] leading-none mt-1">{c.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gender Chart */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl border border-gov-border shadow-sm p-6">
              <h2 className="text-base font-semibold text-[#0B2447] mb-4">Gender Distribution</h2>
              <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
                  <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#6366f1" strokeWidth="3"
                      strokeDasharray={`${data.total > 0 ? (data.boys / data.total) * 100 : 0} 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xl font-bold text-[#0B2447]">{data.total}</span>
                    <span className="text-xs text-gray-400">Total</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="text-sm text-gray-600">Boys</span>
                    <span className="text-sm font-bold text-[#0B2447] ml-auto">{data.boys} ({data.total > 0 ? Math.round(data.boys / data.total * 100) : 0}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-400" />
                    <span className="text-sm text-gray-600">Girls</span>
                    <span className="text-sm font-bold text-[#0B2447] ml-auto">{data.girls} ({data.total > 0 ? Math.round(data.girls / data.total * 100) : 0}%)</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Class-wise */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-gov-border shadow-sm p-6">
              <h2 className="text-base font-semibold text-[#0B2447] mb-4">Students by Class</h2>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {data.classData.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No data</p> : data.classData.map(c => (
                  <div key={c.className} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-500 w-10 shrink-0">Std {c.className}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-[#0B2447]" style={{ width: `${data.total > 0 ? (c.count / data.total) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs font-bold text-gray-700 w-6 text-right">{c.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Attendance Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl border border-gov-border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-[#0B2447]" />
              <h2 className="text-base font-semibold text-[#0B2447]">Monthly Attendance (%)</h2>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.attendance} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B2447" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0B2447" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Attendance']} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="pct" stroke="#0B2447" strokeWidth={2} fill="url(#attGrad)" dot={{ fill: '#D4AF37', strokeWidth: 2, r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </>
      )}
    </div>
  )
}
