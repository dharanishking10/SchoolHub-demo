import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardCheck, BookOpen, FileText, TrendingUp } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface AttSummary { total: number; present: number; absent: number; percentage: number }
interface HW { id: number; title: string; className: string; section: string; subject: string; dueDate: string; status: string }

const cardV = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
}

export default function SDashboard() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<{ className?: string; section?: string; admissionNumber?: string; rollNumber?: string } | null>(null)
  const [attSummary, setAttSummary] = useState<AttSummary | null>(null)
  const [homework, setHomework] = useState<HW[]>([])
  const [marksCount, setMarksCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/auth/me', { headers: h }).then(r => r.json()),
      fetch('/api/attendance/summary', { headers: h }).then(r => r.json()),
      fetch('/api/homework', { headers: h }).then(r => r.json()),
      fetch('/api/marks', { headers: h }).then(r => r.json()),
    ]).then(([me, att, hw, marks]) => {
      if (me.success) setProfile(me.data.user)
      if (att.success) setAttSummary(att.data)
      if (hw.success) setHomework(hw.data.filter((h: HW) => h.status === 'ACTIVE').slice(0, 4))
      if (marks.success) setMarksCount(marks.data.length)
    }).finally(() => setLoading(false))
  }, [token])

  const CARDS = [
    { label: 'Attendance', value: attSummary ? `${attSummary.percentage}%` : '—', sub: `${attSummary?.present || 0} days present`, icon: ClipboardCheck, color: 'bg-emerald-50 text-emerald-700', to: '/dashboard/student/attendance' },
    { label: 'Marks Entered', value: marksCount, sub: 'Subject records', icon: TrendingUp, color: 'bg-blue-50 text-blue-700', to: '/dashboard/student/marks' },
    { label: 'Active Homework', value: homework.length, sub: 'Assigned tasks', icon: FileText, color: 'bg-violet-50 text-violet-700', to: '/dashboard/student/homework' },
    { label: 'My Class', value: profile ? `${profile.className}-${profile.section}` : '—', sub: profile?.rollNumber ? `Roll: ${profile.rollNumber}` : '—', icon: BookOpen, color: 'bg-amber-50 text-amber-700', to: '/dashboard/student/timetable' },
  ]

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0B2447]">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1 text-sm">{today}</p>
        {profile && <p className="text-xs text-gray-400 mt-0.5">Adm: {profile.admissionNumber} · Std {profile.className}-{profile.section}</p>}
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? [...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gov-border animate-pulse" />)
          : CARDS.map((c, i) => (
            <motion.div key={c.label} custom={i} initial="hidden" animate="visible" variants={cardV}
              onClick={() => navigate(c.to)} className="bg-white rounded-2xl shadow-sm border border-gov-border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color} self-start`}><c.icon size={20} /></div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[#0B2447] leading-none">{c.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
                <p className="text-xs text-gray-300 mt-0.5">{c.sub}</p>
              </div>
            </motion.div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Bar */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          <h2 className="text-base font-semibold text-[#0B2447] mb-4">Attendance Overview</h2>
          {loading ? <div className="h-24 bg-gray-100 rounded-xl animate-pulse" /> : attSummary ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Overall Attendance</span>
                <span className="text-xl font-bold text-[#0B2447]">{attSummary.percentage}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${attSummary.percentage}%` }} transition={{ delay: 0.5, duration: 0.8 }}
                  className={`h-3 rounded-full ${attSummary.percentage >= 75 ? 'bg-emerald-500' : attSummary.percentage >= 60 ? 'bg-amber-400' : 'bg-red-500'}`} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Present: <b className="text-emerald-600">{attSummary.present}</b></span>
                <span>Absent: <b className="text-red-500">{attSummary.absent}</b></span>
                <span>Total: <b>{attSummary.total}</b></span>
              </div>
              {attSummary.percentage < 75 && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-2">⚠️ Attendance below 75%. Please improve attendance.</p>}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-4">No attendance records yet</p>}
        </motion.div>

        {/* Homework list */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl shadow-sm border border-gov-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#0B2447]">Pending Homework</h2>
            <button onClick={() => navigate('/dashboard/student/homework')} className="text-xs text-[#0B2447] font-semibold hover:underline">View all</button>
          </div>
          {loading ? <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            : homework.length === 0 ? <p className="text-sm text-gray-400 text-center py-6">No homework assigned</p>
            : (
              <div className="space-y-2">
                {homework.map((hw, i) => (
                  <motion.div key={hw.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gov-bg hover:bg-violet-50 transition-colors">
                    <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0"><FileText size={14} className="text-violet-600" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">{hw.title}</p>
                      <p className="text-xs text-gray-400">{hw.subject} · Due {hw.dueDate}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
        </motion.div>
      </div>
    </div>
  )
}
