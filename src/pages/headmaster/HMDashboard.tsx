import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, GraduationCap, BookOpen, TrendingUp, Plus, UserPlus, BarChart2, School } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface Stats {
  teachers: number
  activeTeachers: number
  students: number
  boys: number
  girls: number
  classes: number
  activities: { id: number; type: string; message: string; createdAt: string }[]
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' } }),
}

const TYPE_ICON: Record<string, string> = { teacher: '👨‍🏫', student: '👨‍🎓', class: '📚', profile: '🏫' }

export default function HMDashboard() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data) })
      .finally(() => setLoading(false))
  }, [token])

  const CARDS = stats ? [
    { label: 'Total Teachers', value: stats.teachers, sub: `${stats.activeTeachers} Active`, icon: Users, color: 'bg-blue-500', light: 'bg-blue-50 text-blue-700' },
    { label: 'Total Students', value: stats.students, sub: `${stats.boys} Boys · ${stats.girls} Girls`, icon: GraduationCap, color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total Classes', value: stats.classes, sub: 'Across all standards', icon: BookOpen, color: 'bg-violet-500', light: 'bg-violet-50 text-violet-700' },
    { label: 'Attendance', value: '87%', sub: 'Monthly average', icon: TrendingUp, color: 'bg-amber-500', light: 'bg-amber-50 text-amber-700' },
  ] : []

  const QUICK = [
    { label: 'Add Teacher', icon: UserPlus, to: '/dashboard/headmaster/teachers' },
    { label: 'View Reports', icon: BarChart2, to: '/dashboard/headmaster/reports' },
    { label: 'School Profile', icon: School, to: '/dashboard/headmaster/school' },
    { label: 'Manage Classes', icon: Plus, to: '/dashboard/headmaster/classes' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0B2447]">
          Welcome, {user?.name?.split(' ')[0] || 'Headmaster'} 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Here's your school overview for today.</p>
      </motion.div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl shadow-sm border border-gov-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {CARDS.map((c, i) => (
            <motion.div key={c.label} custom={i} initial="hidden" animate="visible" variants={cardVariants}
              className="bg-white rounded-2xl shadow-sm border border-gov-border p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.light} shrink-0`}>
                <c.icon size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                <p className="text-3xl font-bold text-[#0B2447] leading-none mt-1">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          <h2 className="text-base font-semibold text-[#0B2447] mb-4">Recent Activities</h2>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}</div>
          ) : stats?.activities.length ? (
            <div className="space-y-3">
              {stats.activities.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.06 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-gov-bg hover:bg-blue-50 transition-colors">
                  <span className="text-xl shrink-0">{TYPE_ICON[a.type] || '📋'}</span>
                  <div>
                    <p className="text-sm text-gray-700 font-medium">{a.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          <h2 className="text-base font-semibold text-[#0B2447] mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {QUICK.map(({ label, icon: Icon, to }) => (
              <button key={label} onClick={() => navigate(to)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0B2447] hover:bg-[#163d6a] text-white text-sm font-medium transition-all duration-150 group">
                <Icon size={16} className="text-secondary" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Tamil Nadu Badge */}
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-xs font-semibold text-amber-800">🏛️ Tamil Nadu Government</p>
            <p className="text-xs text-amber-600 mt-0.5">Unified School Management</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
