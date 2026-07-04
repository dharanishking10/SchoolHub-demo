import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface TEntry { id: number; className: string; section: string; day: string; period: number; subject: string; startTime: string; endTime: string; teacher: { fullName: string; subject: string } }
const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
const DAY_LABELS: Record<string, string> = { MONDAY:'Mon', TUESDAY:'Tue', WEDNESDAY:'Wed', THURSDAY:'Thu', FRIDAY:'Fri' }
const PERIOD_LABELS = ['','8:00–8:45','8:45–9:30','9:45–10:30','10:30–11:15','11:30–12:15','12:15–1:00']

export default function TTimetable() {
  const { token } = useAuth()
  const [entries, setEntries] = useState<TEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/timetable', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setEntries(d.data) }).finally(() => setLoading(false))
  }, [token])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()

  const getEntry = (day: string, period: number) =>
    entries.find(e => e.day === day && e.period === period)

  const periods = [1,2,3,4,5,6]

  const todayEntries = entries.filter(e => e.day === today).sort((a,b) => a.period - b.period)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">My Timetable</h1>
        <p className="text-gray-500 text-sm mt-0.5">Weekly class schedule</p>
      </motion.div>

      {/* Today's Schedule */}
      {todayEntries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#0B2447] rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-secondary" />
            <h2 className="font-bold text-sm">Today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {todayEntries.map(e => (
              <div key={e.id} className="bg-white/10 rounded-xl p-3">
                <p className="text-secondary text-xs font-bold">Period {e.period}</p>
                <p className="font-bold text-sm mt-0.5">Std {e.className}-{e.section}</p>
                <p className="text-white/70 text-xs">{e.startTime} – {e.endTime}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Weekly Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading timetable…</div>
          : entries.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Calendar size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No timetable assigned yet</p>
              <p className="text-sm mt-1">Contact Headmaster to assign your schedule</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-[#0B2447] text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold w-24">Period</th>
                    {DAYS.map(d => (
                      <th key={d} className={`px-4 py-3 text-center text-xs font-semibold ${d === today ? 'text-secondary' : ''}`}>
                        {DAY_LABELS[d]}{d === today ? ' ★' : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(p => (
                    <tr key={p} className="border-t border-gray-100 hover:bg-gov-bg">
                      <td className="px-4 py-3">
                        <p className="text-xs font-bold text-gray-600">P{p}</p>
                        <p className="text-xs text-gray-400">{PERIOD_LABELS[p]}</p>
                      </td>
                      {DAYS.map(d => {
                        const e = getEntry(d, p)
                        return (
                          <td key={d} className={`px-3 py-2 text-center ${d === today ? 'bg-amber-50' : ''}`}>
                            {e ? (
                              <div className="bg-[#0B2447]/8 rounded-lg p-2">
                                <p className="text-xs font-bold text-[#0B2447]">Std {e.className}-{e.section}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{e.startTime}</p>
                              </div>
                            ) : <span className="text-gray-200 text-xs">—</span>}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </motion.div>
    </div>
  )
}
