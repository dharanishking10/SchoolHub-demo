import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface TEntry { id: number; className: string; section: string; day: string; period: number; subject: string; roomNumber: string; startTime: string; endTime: string; teacher: { fullName: string; subject: string } }

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY']
const DAY_LABELS: Record<string, string> = { MONDAY:'Monday', TUESDAY:'Tuesday', WEDNESDAY:'Wednesday', THURSDAY:'Thursday', FRIDAY:'Friday' }
const DAY_SHORT: Record<string, string> = { MONDAY:'Mon', TUESDAY:'Tue', WEDNESDAY:'Wed', THURSDAY:'Thu', FRIDAY:'Fri' }
const PERIOD_TIMES: Record<number, string> = { 1:'8:00–8:45', 2:'8:45–9:30', 3:'9:45–10:30', 4:'10:30–11:15', 5:'11:30–12:15', 6:'12:15–1:00' }
const BREAK_AFTER: Record<number, string> = { 2:'Snack Break (9:30–9:45)', 4:'Lunch Break (11:15–11:30)' }

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'bg-blue-100 text-blue-700 border-blue-200',
  Science: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Tamil: 'bg-orange-100 text-orange-700 border-orange-200',
  English: 'bg-violet-100 text-violet-700 border-violet-200',
  'Social Science': 'bg-amber-100 text-amber-700 border-amber-200',
  'Computer Science': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  Physics: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Chemistry: 'bg-pink-100 text-pink-700 border-pink-200',
  Biology: 'bg-teal-100 text-teal-700 border-teal-200',
}

export default function STimetable() {
  const { token } = useAuth()
  const [entries, setEntries] = useState<TEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'week' | 'day'>('week')

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const [selectedDay, setSelectedDay] = useState(DAYS.includes(todayName) ? todayName : 'MONDAY')

  useEffect(() => {
    fetch('/api/timetable', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setEntries(d.data) }).finally(() => setLoading(false))
  }, [token])

  const getEntry = (day: string, period: number) => entries.find(e => e.day === day && e.period === period)
  const dayEntries = entries.filter(e => e.day === selectedDay).sort((a,b) => a.period - b.period)
  const periods = [1,2,3,4,5,6]

  const subjectColor = (subject: string) => SUBJECT_COLORS[subject] || 'bg-gray-100 text-gray-700 border-gray-200'

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Timetable</h1>
          <p className="text-gray-500 text-sm mt-0.5">Class schedule</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setView('day')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'day' ? 'bg-white text-[#0B2447] shadow-sm' : 'text-gray-500'}`}>Day</button>
          <button onClick={() => setView('week')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${view === 'week' ? 'bg-white text-[#0B2447] shadow-sm' : 'text-gray-500'}`}>Week</button>
        </div>
      </motion.div>

      {loading ? <div className="h-64 bg-white rounded-2xl border animate-pulse" />
        : entries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gov-border text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No timetable assigned yet</p>
          </div>
        ) : view === 'day' ? (
          <>
            <div className="flex gap-1 mb-5 flex-wrap">
              {DAYS.map(d => (
                <button key={d} onClick={() => setSelectedDay(d)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${selectedDay === d ? 'bg-[#0B2447] text-white' : (d === todayName ? 'bg-secondary/20 text-[#0B2447] border border-secondary' : 'bg-white border border-gov-border text-gray-600 hover:bg-gray-50')}`}>
                  {DAY_SHORT[d]}{d === todayName ? ' (Today)' : ''}
                </button>
              ))}
            </div>
            <motion.div key={selectedDay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {periods.map(p => {
                const e = getEntry(selectedDay, p)
                return (
                  <div key={p}>
                    <div className={`rounded-2xl p-4 flex items-center gap-4 border ${e ? subjectColor(e.subject) : 'bg-gray-50 border-gray-100'}`}>
                      <div className="shrink-0 text-center w-12">
                        <p className="text-xs font-bold opacity-60">P{p}</p>
                        <p className="text-xs opacity-50 mt-0.5">{PERIOD_TIMES[p]?.split('–')[0]}</p>
                      </div>
                      {e ? (
                        <div className="flex-1">
                          <p className="font-bold text-sm">{e.subject}</p>
                          <p className="text-xs opacity-70">{e.teacher.fullName} · {e.startTime}–{e.endTime}{e.roomNumber ? ` · ${e.roomNumber}` : ''}</p>
                        </div>
                      ) : <p className="text-sm opacity-40 flex-1">Free Period</p>}
                    </div>
                    {BREAK_AFTER[p] && <div className="text-center py-1.5 text-xs text-amber-600 font-semibold bg-amber-50 rounded-lg my-1">{BREAK_AFTER[p]}</div>}
                  </div>
                )
              })}
            </motion.div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-[#0B2447] text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold w-20">Period</th>
                    {DAYS.map(d => (
                      <th key={d} className={`px-3 py-3 text-center text-xs font-semibold ${d === todayName ? 'text-secondary' : ''}`}>{DAY_SHORT[d]}{d === todayName ? '★' : ''}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(p => (
                    <>
                      <tr key={p} className="border-t border-gray-100 hover:bg-gov-bg">
                        <td className="px-4 py-2">
                          <p className="text-xs font-bold text-gray-600">P{p}</p>
                          <p className="text-xs text-gray-400">{PERIOD_TIMES[p]}</p>
                        </td>
                        {DAYS.map(d => {
                          const e = getEntry(d, p)
                          return (
                            <td key={d} className={`px-2 py-2 text-center ${d === todayName ? 'bg-amber-50' : ''}`}>
                              {e ? (
                                <div className={`rounded-lg px-2 py-1.5 border text-xs ${subjectColor(e.subject)}`}>
                                  <p className="font-bold">{e.subject}</p>
                                </div>
                              ) : <span className="text-gray-200 text-xs">—</span>}
                            </td>
                          )
                        })}
                      </tr>
                      {BREAK_AFTER[p] && (
                        <tr key={`break-${p}`} className="bg-amber-50">
                          <td colSpan={6} className="px-4 py-1.5 text-center text-xs font-semibold text-amber-600">{BREAK_AFTER[p]}</td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  )
}
