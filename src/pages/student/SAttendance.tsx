import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Clock, CalendarOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface AttRecord { id: number; date: string; status: string; className: string; section: string }
interface Summary { total: number; present: number; absent: number; late: number; leave: number; percentage: number; recent: AttRecord[]; today: string | null }

const STATUS_STYLE: Record<string, { icon: typeof CheckCircle; bg: string; text: string; label: string; dot: string }> = {
  PRESENT: { icon: CheckCircle, bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Present', dot: 'bg-emerald-500' },
  ABSENT: { icon: XCircle, bg: 'bg-red-100', text: 'text-red-600', label: 'Absent', dot: 'bg-red-500' },
  LEAVE: { icon: CalendarOff, bg: 'bg-purple-100', text: 'text-purple-600', label: 'Leave', dot: 'bg-purple-500' },
  LATE: { icon: Clock, bg: 'bg-amber-100', text: 'text-amber-600', label: 'Late', dot: 'bg-amber-500' },
  HALF_DAY: { icon: Clock, bg: 'bg-sky-100', text: 'text-sky-600', label: 'Half Day', dot: 'bg-sky-400' },
}

export default function SAttendance() {
  const { token } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [monthOffset, setMonthOffset] = useState(0)

  useEffect(() => {
    fetch('/api/attendance/summary', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setSummary(d.data) }).finally(() => setLoading(false))
  }, [token])

  const byDate: Record<string, string> = {}
  summary?.recent.forEach(r => { byDate[r.date] = r.status })

  const viewDate = new Date()
  viewDate.setMonth(viewDate.getMonth() + monthOffset)
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = firstDay.getDay()
  const monthLabel = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">My Attendance</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track your attendance records</p>
      </motion.div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border animate-pulse" />)}</div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total Days', value: summary.total, color: 'bg-gray-50 text-gray-700' },
              { label: 'Present', value: summary.present, color: 'bg-emerald-50 text-emerald-700' },
              { label: 'Absent', value: summary.absent, color: 'bg-red-50 text-red-600' },
              { label: 'Leave', value: summary.leave, color: 'bg-purple-50 text-purple-600' },
              { label: 'Late', value: summary.late, color: 'bg-amber-50 text-amber-600' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`rounded-2xl p-5 border border-gov-border ${s.color}`}>
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-xs font-semibold mt-1 opacity-70">{s.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl shadow-sm border border-gov-border p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-[#0B2447]">Overall Attendance</h2>
              <span className={`text-2xl font-extrabold ${summary.percentage >= 75 ? 'text-emerald-600' : summary.percentage >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{summary.percentage}%</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden mb-2">
              <motion.div initial={{ width: 0 }} animate={{ width: `${summary.percentage}%` }} transition={{ delay: 0.4, duration: 1 }}
                className={`h-4 rounded-full ${summary.percentage >= 75 ? 'bg-emerald-500' : summary.percentage >= 60 ? 'bg-amber-400' : 'bg-red-500'}`} />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>0%</span><span className="font-semibold text-amber-500">75% (min)</span><span>100%</span>
            </div>
            {summary.percentage < 75 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                ⚠️ Your attendance is below the minimum 75% requirement. Please attend classes regularly.
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="bg-white rounded-2xl shadow-sm border border-gov-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#0B2447]">Attendance Calendar</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setMonthOffset(m => m - 1)} className="p-1.5 rounded-lg hover:bg-gov-bg text-gray-500"><ChevronLeft size={16} /></button>
                <span className="text-sm font-semibold text-gray-700 w-32 text-center">{monthLabel}</span>
                <button onClick={() => setMonthOffset(m => Math.min(0, m + 1))} disabled={monthOffset === 0} className="p-1.5 rounded-lg hover:bg-gov-bg text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center text-[11px] font-bold text-gray-400 py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />
                const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`
                const status = byDate[dateStr]
                const style = status ? STATUS_STYLE[status] : null
                const isToday = dateStr === new Date().toISOString().split('T')[0]
                return (
                  <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative ${style ? style.bg : 'bg-gray-50'} ${isToday ? 'ring-2 ring-[#0B2447]' : ''}`}>
                    <span className={`font-semibold ${style ? style.text : 'text-gray-400'}`}>{day}</span>
                    {style && <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${style.dot}`} />}
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
              {Object.entries(STATUS_STYLE).map(([key, s]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} /> {s.label}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gov-border p-6">
            <h2 className="text-base font-semibold text-[#0B2447] mb-4">Recent Attendance</h2>
            {summary.recent.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No records found</p>
            ) : (
              <div className="space-y-2">
                {summary.recent.slice(0, 30).map((r, i) => {
                  const S = STATUS_STYLE[r.status] || STATUS_STYLE.PRESENT
                  const Icon = S.icon
                  return (
                    <motion.div key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.02 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gov-bg transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${S.bg}`}>
                        <Icon size={15} className={S.text} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${S.bg} ${S.text}`}>{S.label}</span>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </>
      ) : <p className="text-center text-gray-400 py-16">No attendance data found</p>}
    </div>
  )
}
