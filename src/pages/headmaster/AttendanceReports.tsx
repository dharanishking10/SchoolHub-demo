import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardCheck, Download, FileSpreadsheet } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface ClassStat { present: number; absent: number; leave: number; late: number; total: number }
interface StudentStat { name: string; rollNumber: string; present: number; absent: number; leave: number; late: number; total: number }

const CLASSES = ['', 'VI','VII','VIII','IX','X','XI','XII']
const SECTIONS = ['', 'A','B']

export default function AttendanceReports() {
  const { token } = useAuth()
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [byClass, setByClass] = useState<Record<string, ClassStat>>({})
  const [byStudent, setByStudent] = useState<Record<number, StudentStat>>({})
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (className) params.set('className', className)
    if (section) params.set('section', section)
    if (month) params.set('month', month)
    fetch(`/api/attendance/reports?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) { setByClass(d.data.byClass); setByStudent(d.data.byStudent) } })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [className, section, month, token])

  const exportCsv = (endpoint: string) => {
    const params = new URLSearchParams()
    if (className) params.set('className', className)
    if (section) params.set('section', section)
    fetch(`${endpoint}?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = endpoint.split('/').pop() + '.csv'
        a.click(); URL.revokeObjectURL(url)
      })
  }

  const studentRows = Object.values(byStudent).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Attendance Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">Class and student-level attendance analytics</p>
        </div>
        <button onClick={() => exportCsv('/api/export/attendance')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B2447] text-white hover:bg-[#163d6a] transition-colors">
          <Download size={15} /> Export CSV
        </button>
      </motion.div>

      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Class</label>
            <select value={className} onChange={e => setClassName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
              <option value="">All Classes</option>
              {CLASSES.filter(Boolean).map(c => <option key={c} value={c}>Std {c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Section</label>
            <select value={section} onChange={e => setSection(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
              <option value="">All Sections</option>
              {SECTIONS.filter(Boolean).map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Month</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <ClipboardCheck size={18} className="text-[#0B2447]" />
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
                  <th className="py-2 pr-4">Class</th>
                  <th className="py-2 pr-4 text-center">Present</th>
                  <th className="py-2 pr-4 text-center">Absent</th>
                  <th className="py-2 pr-4 text-center">Leave</th>
                  <th className="py-2 pr-4 text-center">Late</th>
                  <th className="py-2 pr-4 text-center">Total</th>
                  <th className="py-2 text-center">% Present</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(byClass).map(([key, s]) => (
                  <tr key={key} className="border-b border-gray-50 hover:bg-gov-bg">
                    <td className="py-2.5 pr-4 font-semibold text-gray-700">Std {key}</td>
                    <td className="py-2.5 pr-4 text-center text-emerald-600 font-semibold">{s.present}</td>
                    <td className="py-2.5 pr-4 text-center text-red-500 font-semibold">{s.absent}</td>
                    <td className="py-2.5 pr-4 text-center text-purple-500 font-semibold">{s.leave}</td>
                    <td className="py-2.5 pr-4 text-center text-amber-500 font-semibold">{s.late}</td>
                    <td className="py-2.5 pr-4 text-center text-gray-500">{s.total}</td>
                    <td className="py-2.5 text-center font-bold text-[#0B2447]">{s.total > 0 ? Math.round((s.present / s.total) * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-[#0B2447]" />
            <h2 className="text-base font-semibold text-[#0B2447]">Student-wise Detail</h2>
          </div>
        </div>
        {loading ? (
          <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
        ) : studentRows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No records found</p>
        ) : (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-xs font-semibold text-gray-500 border-b border-gov-border">
                  <th className="py-2 pr-4">Roll</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4 text-center">Present</th>
                  <th className="py-2 pr-4 text-center">Absent</th>
                  <th className="py-2 pr-4 text-center">Leave</th>
                  <th className="py-2 pr-4 text-center">Late</th>
                  <th className="py-2 text-center">% Present</th>
                </tr>
              </thead>
              <tbody>
                {studentRows.map(s => {
                  const pct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
                  return (
                    <tr key={s.rollNumber} className="border-b border-gray-50 hover:bg-gov-bg">
                      <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">{s.rollNumber}</td>
                      <td className="py-2.5 pr-4 font-semibold text-gray-700">{s.name}</td>
                      <td className="py-2.5 pr-4 text-center text-emerald-600 font-semibold">{s.present}</td>
                      <td className="py-2.5 pr-4 text-center text-red-500 font-semibold">{s.absent}</td>
                      <td className="py-2.5 pr-4 text-center text-purple-500 font-semibold">{s.leave}</td>
                      <td className="py-2.5 pr-4 text-center text-amber-500 font-semibold">{s.late}</td>
                      <td className={`py-2.5 text-center font-bold ${pct < 75 ? 'text-red-500' : 'text-[#0B2447]'}`}>{pct}%{pct < 75 && ' ⚠️'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
