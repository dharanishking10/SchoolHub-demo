import { useEffect, useState } from 'react'
import { motion, Variants } from 'framer-motion'
import { Users, GraduationCap, BookOpen, TrendingUp, UserPlus, BarChart2, School } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface DashStats {
  teachers: number; activeTeachers: number; students: number; boys: number; girls: number
  classes: number; activities: { id: number; type: string; message: string; createdAt: string }[]
  classData: { className: string; count: number }[]
  recentAdmissions: { id: number; admissionNumber?: string; fullName: string; className: string; section: string; gender: string; createdAt: string }[]
}

const cardV: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' } }),
}
const TYPE_ICON: Record<string, string> = { teacher: '👨‍🏫', student: '👨‍🎓', class: '📚', profile: '🏫' }
const GENDER_COLOR: Record<string, string> = { MALE: 'bg-blue-100 text-blue-700', FEMALE: 'bg-pink-100 text-pink-700' }

export default function HMDashboard() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setStats(d.data) }).finally(() => setLoading(false))
  }, [token])

  const CARDS = stats ? [
    { label: 'Total Teachers', value: stats.teachers, sub: `${stats.activeTeachers} Active`, icon: Users, light: 'bg-blue-50 text-blue-700' },
    { label: 'Total Students', value: stats.students, sub: `${stats.boys} Boys · ${stats.girls} Girls`, icon: GraduationCap, light: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total Classes', value: stats.classes, sub: 'Std VI – XII', icon: BookOpen, light: 'bg-violet-50 text-violet-700' },
    { label: 'Avg Attendance', value: '87%', sub: 'Monthly average', icon: TrendingUp, light: 'bg-amber-50 text-amber-700' },
  ] : []

  const QUICK = [
    { label: 'Add Student', icon: UserPlus, to: '/dashboard/headmaster/students' },
    { label: 'Add Teacher', icon: Users, to: '/dashboard/headmaster/teachers' },
    { label: 'View Reports', icon: BarChart2, to: '/dashboard/headmaster/reports' },
    { label: 'School Profile', icon: School, to: '/dashboard/headmaster/school' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0B2447]">Welcome, {user?.name?.split(' ')[0] || 'Headmaster'} 👋</h1>
        <p className="text-gray-500 mt-1 text-sm">Here's your school overview for today.</p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gov-border animate-pulse" />) :
          CARDS.map((c, i) => (
            <motion.div key={c.label} custom={i} initial="hidden" animate="visible" variants={cardV}
              className="bg-white rounded-2xl shadow-sm border border-gov-border p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.light} shrink-0`}><c.icon size={22} /></div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                <p className="text-3xl font-bold text-[#0B2447] leading-none mt-1">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
              </div>
            </motion.div>
          ))
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          <h2 className="text-base font-semibold text-[#0B2447] mb-4">Recent Activities</h2>
          {loading ? <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}</div>
            : stats?.activities.length ? (
              <div className="space-y-2">
                {stats.activities.map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.06 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gov-bg hover:bg-blue-50 transition-colors">
                    <span className="text-lg shrink-0">{TYPE_ICON[a.type] || '📋'}</span>
                    <div>
                      <p className="text-sm text-gray-700 font-medium">{a.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          <h2 className="text-base font-semibold text-[#0B2447] mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {QUICK.map(({ label, icon: Icon, to }) => (
              <button key={label} onClick={() => navigate(to)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0B2447] hover:bg-[#163d6a] text-white text-sm font-medium transition-all group">
                <Icon size={16} className="text-secondary" /><span>{label}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-xs font-semibold text-amber-800">🏛️ Tamil Nadu Government</p>
            <p className="text-xs text-amber-600 mt-0.5">Academic Year 2025-2026</p>
          </div>
        </motion.div>
      </div>

      {/* Gender + Class-wise + Recent Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          <h2 className="text-sm font-semibold text-[#0B2447] mb-4">Gender Distribution</h2>
          {loading ? <div className="h-24 bg-gray-100 rounded-xl animate-pulse" /> : stats && (
            <div className="space-y-3">
              {[{ label: 'Boys', value: stats.boys, pct: stats.students > 0 ? Math.round(stats.boys / stats.students * 100) : 0, color: 'bg-blue-500' },
                { label: 'Girls', value: stats.girls, pct: stats.students > 0 ? Math.round(stats.girls / stats.students * 100) : 0, color: 'bg-pink-400' }
              ].map(g => (
                <div key={g.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-600">{g.label}</span>
                    <span className="font-bold text-gray-700">{g.value} ({g.pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full"><div className={`h-2.5 rounded-full ${g.color} transition-all`} style={{ width: `${g.pct}%` }} /></div>
                </div>
              ))}
              <p className="text-xs text-gray-400 text-center mt-2">Total: {stats.students} students</p>
            </div>
          )}
        </motion.div>

        {/* Class-wise */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          <h2 className="text-sm font-semibold text-[#0B2447] mb-4">Students by Standard</h2>
          {loading ? <div className="h-24 bg-gray-100 rounded-xl animate-pulse" /> : stats && (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {stats.classData.map(c => (
                <div key={c.className} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 w-10 shrink-0">Std {c.className}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full bg-[#0B2447]" style={{ width: `${stats.students > 0 ? (c.count / stats.students) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-5 text-right">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Admissions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0B2447]">Recent Admissions</h2>
            <button onClick={() => navigate('/dashboard/headmaster/students')} className="text-xs text-[#0B2447] font-semibold hover:underline">View all</button>
          </div>
          {loading ? <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
            : stats?.recentAdmissions?.length ? (
              <div className="space-y-2">
                {stats.recentAdmissions.map(s => (
                  <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${GENDER_COLOR[s.gender] || 'bg-gray-100 text-gray-600'}`}>
                      {s.fullName[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-700 truncate">{s.fullName}</p>
                      <p className="text-xs text-gray-400">Std {s.className}-{s.section}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{s.admissionNumber || '—'}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-gray-400 text-center py-4">No recent admissions</p>}
        </motion.div>
      </div>
    </div>
  )
}
