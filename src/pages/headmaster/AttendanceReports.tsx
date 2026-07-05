import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardCheck, Download, Users, UserCheck, UserX, Clock,
  TrendingUp, FileSpreadsheet, Calendar
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useAuth } from '../../contexts/AuthContext'

interface ClassStat { present: number; absent: number; leave: number; late: number; halfDay: number; total: number }
interface StudentStat { name: string; rollNumber: string; present: number; absent: number; leave: number; late: number; halfDay: number; total: number }
interface TodayStats { date: string; total: number; present: number; absent: number; late: number; halfDay: number; leave: number; percentage: number }
interface DateStat { present: number; absent: number; late: number; halfDay: number; total: number }

const CLASSES = ['VI','VII','VIII','IX','X','XI','XII']
const SECTIONS = ['A','B']

export default function AttendanceReports() {
  const { token } = useAuth()
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [byClass, setByClass] = useState<Record<string, ClassStat>>({})
  const [byStudent, setByStudent] = useState<Record<number, StudentStat>>({})
  const [byDate, setByDate] = useState<Record<string, DateStat>>({})
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [todayLoading, setTodayLoading] = useState(true)

  const loadToday = useCallback(() => {
    setTodayLoading(true)
    fetch('/api/attendance/today-stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setTodayStats(d.data) })
      .finally(() => setTodayLoading(false))
  }, [token])

  const loadReports = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (className) params.set('className', className)
    if (section) params.set('section', section)
    if (month) params.set('month', month)
    fetch(`/api/attendance/reports?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => {
        if (d.success) {
          setByClass(d.data.byClass)
          setByStudent(d.data.byStudent)
          setByDate(d.data.byDate || {})
        }
      })
      .finally(() => setLoading(false))
  }, [className, section, month, token])

  useEffect(() => { loadToday() }, [loadToday])
  useEffect(() => { loadReports() }, [loadReports])

  const exportCSV = () => {
    const studentRows = Object.values(byStudent).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
    const headers = ['Roll No', 'Name', 'Present', 'Absent', 'Leave', 'Late', 'Half Day', 'Total', '% Present']
    const rows = studentRows.map(s => {
      const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
      return [s.rollNumber, s.name, s.present, s.absent, s.leave, s.late, s.halfDay, s.total, `${pct}%`]
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `attendance_${month}_${className || 'all'}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const studentRows = Object.values(byStudent).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))

  // Build chart data from byDate (last 14 days of the selected month)
  const chartData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, s]) => ({
      date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      Present: s.present,
      Absent: s.absent,
      Late: s.late,
    }))

  const todayCards = [
    { label: "Today's Marked", value: todayStats?.total ?? '—', icon: ClipboardCheck, color: 'bg-blue-50 text-blue-700', border: 'border-blue-100' },
    { label: 'Present', value: todayStats?.present ?? '—', icon: UserCheck, color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-100' },
    { label: 'Absent', value: todayStats?.absent ?? '—', icon: UserX, color: 'bg-red-50 text-red-700', border: 'border-red-100' },
    { label: 'Late', value: todayStats?.late ?? '—', icon: Clock, color: 'bg-amber-50 text-amber-700', border: 'border-amber-100' },
    { label: 'Attendance %', value: todayStats ? `${todayStats.percentage}%` : '—', icon: TrendingUp, color: 'bg-violet-50 text-violet-700', border: 'border-violet-100' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Attendance Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">Today's overview and class-wise attendance analytics</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B2447] text-white hover:bg-[#163d6a] transition-colors shadow-sm">
          <Download size={15} /> Export CSV
        </button>
      </motion.div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-7">
        {todayCards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`bg-white rounded-2xl border ${c.border} shadow-sm p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
              <c.icon size={18} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${todayLoading ? 'text-gray-300 animate-pulse' : 'text-[#0B2447]'}`}>
                {todayLoading ? '—' : c.value}
              </p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gov-border p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-[#0B2447]" />
          <h2 className="text-sm font-bold text-[#0B2447] uppercase tracking-wider">Filters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Class</label>
            <select value={className} onChange={e => setClassName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]">
              <option value="">All Classes</option>
              {CLASSES.map(c => <option key={c} value={c}>Std {c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Section</label>
            <select value={section} onChange={e => setSection(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]">
              <option value="">All Sections</option>
              {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Month</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]" />
          </div>
        </div>
      </motion.div>

      {/* Daily Attendance Chart */}
      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-sm border border-gov-border p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-[#0B2447]" />
            <h2 className="text-base font-semibold text-[#0B2447]">Daily Attendance Trend</h2>
            <span className="text-xs text-gray-400 ml-auto">Last {chartData.length} days</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                cursor={{ fill: 'rgba(11,36,71,0.04)' }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Class-wise Summary */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-sm border border-gov-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Users size={18} className="text-[#0B2447]" />
          <h2 className="text-base font-semibold text-[#0B2447]">Class-wise Summary</h2>
        </div>
        {loading ? (
          <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />
        ) : Object.keys(byClass).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No attendance records for this filter</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500 border-b border-gov-border">
                  {['Class','Present','Absent','Leave','Late','Half Day','Total','% Present'].map(h => (
                    <th key={h} className="py-2.5 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(byClass).sort(([a],[b]) => a.localeCompare(b)).map(([key, s]) => {
                  const pct = s.total > 0 ? Math.round(((s.present + s.halfDay * 0.5) / s.total) * 100) : 0
                  return (
                    <tr key={key} className="border-b border-gray-50 hover:bg-gov-bg">
                      <td className="py-2.5 pr-4 font-bold text-gray-700">Std {key}</td>
                      <td className="py-2.5 pr-4 text-emerald-600 font-semibold">{s.present}</td>
                      <td className="py-2.5 pr-4 text-red-500 font-semibold">{s.absent}</td>
                      <td className="py-2.5 pr-4 text-purple-500 font-semibold">{s.leave}</td>
                      <td className="py-2.5 pr-4 text-amber-500 font-semibold">{s.late}</td>
                      <td className="py-2.5 pr-4 text-sky-500 font-semibold">{s.halfDay}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{s.total}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`font-bold text-xs ${pct < 75 ? 'text-red-500' : 'text-[#0B2447]'}`}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Student-wise Detail */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="bg-white rounded-2xl shadow-sm border border-gov-border p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-[#0B2447]" />
            <h2 className="text-base font-semibold text-[#0B2447]">Student-wise Detail</h2>
            {studentRows.length > 0 && <span className="text-xs text-gray-400">({studentRows.length} students)</span>}
          </div>
        </div>
        {loading ? (
          <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
        ) : studentRows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No records found for this filter</p>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-left text-xs font-semibold text-gray-500 border-b border-gov-border">
                  {['Roll','Name','Present','Absent','Leave','Late','Half Day','% Present'].map(h => (
                    <th key={h} className="py-2.5 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentRows.map(s => {
                  const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
                  return (
                    <tr key={s.rollNumber} className="border-b border-gray-50 hover:bg-gov-bg">
                      <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">{s.rollNumber}</td>
                      <td className="py-2.5 pr-4 font-semibold text-gray-700 whitespace-nowrap">{s.name}</td>
                      <td className="py-2.5 pr-4 text-emerald-600 font-semibold">{s.present}</td>
                      <td className="py-2.5 pr-4 text-red-500 font-semibold">{s.absent}</td>
                      <td className="py-2.5 pr-4 text-purple-500 font-semibold">{s.leave}</td>
                      <td className="py-2.5 pr-4 text-amber-500 font-semibold">{s.late}</td>
                      <td className="py-2.5 pr-4 text-sky-500 font-semibold">{s.halfDay}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`font-bold text-xs ${pct < 75 ? 'text-red-500' : 'text-[#0B2447]'}`}>
                            {pct}%{pct < 75 && ' ⚠️'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
