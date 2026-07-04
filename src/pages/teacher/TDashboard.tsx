import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, FileText, Mail, ClipboardCheck, TrendingUp, Calendar } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface Profile { fullName: string; subject: string; employeeId: string; mobile: string; email?: string }
interface Stats { students: number; homework: number; pendingLeave: number; todayAttendance: number }

const cardV = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
}

export default function TDashboard() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats>({ students: 0, homework: 0, pendingLeave: 0, todayAttendance: 0 })
  const [loading, setLoading] = useState(true)
  const [homework, setHomework] = useState<Array<{ id: number; title: string; className: string; section: string; dueDate: string; status: string }>>([])

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` }
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      fetch('/api/auth/me', { headers: h }).then(r => r.json()),
      fetch('/api/students?limit=200', { headers: h }).then(r => r.json()),
      fetch('/api/homework', { headers: h }).then(r => r.json()),
      fetch(`/api/leave?status=PENDING`, { headers: h }).then(r => r.json()),
      fetch(`/api/attendance?date=${today}`, { headers: h }).then(r => r.json()),
    ]).then(([me, stu, hw, leave, att]) => {
      if (me.success) setProfile(me.data.user)
      setStats({
        students: stu.success ? stu.data.total : 0,
        homework: hw.success ? hw.data.length : 0,
        pendingLeave: leave.success ? leave.data.length : 0,
        todayAttendance: att.success ? att.data.length : 0,
      })
      if (hw.success) setHomework(hw.data.slice(0, 4))
    }).finally(() => setLoading(false))
  }, [token])

  const CARDS = [
    { label: 'Total Students', value: stats.students, icon: Users, color: 'bg-blue-50 text-blue-700' },
    { label: 'Active Homework', value: stats.homework, icon: FileText, color: 'bg-violet-50 text-violet-700' },
    { label: 'Pending Leaves', value: stats.pendingLeave, icon: Mail, color: 'bg-amber-50 text-amber-700' },
    { label: "Today's Attendance", value: stats.todayAttendance, icon: ClipboardCheck, color: 'bg-emerald-50 text-emerald-700' },
  ]

  const QUICK = [
    { label: 'Mark Attendance', icon: ClipboardCheck, to: '/dashboard/teacher/attendance' },
    { label: 'Add Marks', icon: TrendingUp, to: '/dashboard/teacher/marks' },
    { label: 'Create Homework', icon: FileText, to: '/dashboard/teacher/homework' },
    { label: 'View Timetable', icon: Calendar, to: '/dashboard/teacher/timetable' },
  ]

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0B2447]">Welcome, {profile?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Teacher'} 👋</h1>
        <p className="text-gray-500 mt-1 text-sm">{today} · {profile?.subject} Teacher</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gov-border animate-pulse" />)
          : CARDS.map((c, i) => (
            <motion.div key={c.label} custom={i} initial="hidden" animate="visible" variants={cardV}
              className="bg-white rounded-2xl shadow-sm border border-gov-border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color} self-start`}><c.icon size={20} /></div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#0B2447] leading-none">{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.label}</p>
              </div>
            </motion.div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#0B2447]">Recent Homework</h2>
            <button onClick={() => navigate('/dashboard/teacher/homework')} className="text-xs text-[#0B2447] font-semibold hover:underline">View all</button>
          </div>
          {homework.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No homework assigned yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {homework.map((hw, i) => (
                <motion.div key={hw.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gov-bg hover:bg-blue-50 transition-colors">
                  <div className="w-8 h-8 bg-[#0B2447]/10 rounded-lg flex items-center justify-center shrink-0"><FileText size={14} className="text-[#0B2447]" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{hw.title}</p>
                    <p className="text-xs text-gray-400">Std {hw.className}-{hw.section} · Due {hw.dueDate}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${hw.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{hw.status}</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          <h2 className="text-base font-semibold text-[#0B2447] mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {QUICK.map(({ label, icon: Icon, to }) => (
              <button key={label} onClick={() => navigate(to)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0B2447] hover:bg-[#163d6a] text-white text-sm font-medium transition-all">
                <Icon size={15} className="text-secondary" />{label}
              </button>
            ))}
          </div>
          {profile && (
            <div className="mt-5 p-3 bg-gov-bg border border-gov-border rounded-xl">
              <p className="text-xs font-semibold text-gray-600">My Subject</p>
              <p className="text-base font-bold text-[#0B2447] mt-0.5">{profile.subject}</p>
              <p className="text-xs text-gray-400 mt-0.5">Emp: {profile.employeeId}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
