import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, CalendarOff, Save, Users, RotateCcw, AlertTriangle, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

type AttStatus = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE'
interface Student { id: number; fullName: string; rollNumber: string; gender: string }
interface AttRecord { studentId: number; status: AttStatus }

const CLASSES = ['VI','VII','VIII','IX','X','XI','XII']
const SECTIONS = ['A','B']
const today = () => new Date().toISOString().split('T')[0]

export default function TAttendance() {
  const { token, user } = useAuth()
  const [date, setDate] = useState(today())
  const [className, setClassName] = useState('X')
  const [section, setSection] = useState('A')
  const [students, setStudents] = useState<Student[]>([])
  const [records, setRecords] = useState<Record<number, AttStatus>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingAtt, setExistingAtt] = useState<Record<number, AttStatus>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState('')

  const isPastDate = date !== today()
  const isReadOnlyForTeacher = user?.role === 'TEACHER' && isPastDate

  const loadStudents = async () => {
    setLoading(true)
    const h = { Authorization: `Bearer ${token}` }
    const [stuRes, attRes] = await Promise.all([
      fetch(`/api/students?className=${className}&section=${section}&limit=50&status=ACTIVE`, { headers: h }).then(r => r.json()),
      fetch(`/api/attendance?className=${className}&section=${section}&date=${date}`, { headers: h }).then(r => r.json()),
    ])
    const stuList: Student[] = stuRes.success ? stuRes.data.students.map((s: { id: number; fullName: string; rollNumber: string; gender: string }) => ({ id: s.id, fullName: s.fullName, rollNumber: s.rollNumber, gender: s.gender })) : []
    setStudents(stuList)
    const existing: Record<number, AttStatus> = {}
    if (attRes.success) attRes.data.forEach((a: { studentId: number; status: AttStatus }) => { existing[a.studentId] = a.status })
    setExistingAtt(existing)
    const init: Record<number, AttStatus> = {}
    stuList.forEach(s => { init[s.id] = existing[s.id] || 'PRESENT' })
    setRecords(init)
    setLoading(false)
  }

  useEffect(() => { loadStudents() }, [className, section, date])

  const toggle = (id: number, status: AttStatus) => setRecords(r => ({ ...r, [id]: status }))
  const markAll = (status: AttStatus) => {
    const all: Record<number, AttStatus> = {}
    students.forEach(s => { all[s.id] = status })
    setRecords(all)
  }
  const resetAll = () => {
    const init: Record<number, AttStatus> = {}
    students.forEach(s => { init[s.id] = existingAtt[s.id] || 'PRESENT' })
    setRecords(init)
  }

  const submit = async () => {
    setSaving(true)
    setError('')
    setConfirmOpen(false)
    const payload: AttRecord[] = students.map(s => ({ studentId: s.id, status: records[s.id] || 'PRESENT' }))
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ date, className, section, records: payload }),
    })
    const json = await res.json()
    if (!json.success) { setError(json.message || 'Failed to save attendance'); setSaving(false); return }
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    loadStudents()
  }

  const present = Object.values(records).filter(s => s === 'PRESENT').length
  const absent = Object.values(records).filter(s => s === 'ABSENT').length
  const leave = Object.values(records).filter(s => s === 'LEAVE').length
  const late = Object.values(records).filter(s => s === 'LATE').length

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">Mark Attendance</h1>
        <p className="text-gray-500 text-sm mt-0.5">Select class and date to mark attendance</p>
      </motion.div>

      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-5 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today()}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Class</label>
            <select value={className} onChange={e => setClassName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
              {CLASSES.map(c => <option key={c} value={c}>Std {c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Section</label>
            <select value={section} onChange={e => setSection(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
              {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {isReadOnlyForTeacher && (
        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium flex items-center gap-2">
          <AlertTriangle size={14} /> Teachers can only mark or edit today's attendance. Contact the Headmaster to change past records.
        </div>
      )}
      {error && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {students.length > 0 && (
        <>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="flex-1 min-w-[80px] bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center"><p className="text-xl font-bold text-emerald-700">{present}</p><p className="text-xs text-emerald-600">Present</p></div>
            <div className="flex-1 min-w-[80px] bg-red-50 border border-red-200 rounded-xl p-3 text-center"><p className="text-xl font-bold text-red-600">{absent}</p><p className="text-xs text-red-500">Absent</p></div>
            <div className="flex-1 min-w-[80px] bg-purple-50 border border-purple-200 rounded-xl p-3 text-center"><p className="text-xl font-bold text-purple-600">{leave}</p><p className="text-xs text-purple-500">Leave</p></div>
            <div className="flex-1 min-w-[80px] bg-amber-50 border border-amber-200 rounded-xl p-3 text-center"><p className="text-xl font-bold text-amber-600">{late}</p><p className="text-xs text-amber-500">Late</p></div>
            <div className="flex-1 min-w-[80px] bg-blue-50 border border-blue-200 rounded-xl p-3 text-center"><p className="text-xl font-bold text-blue-700">{students.length}</p><p className="text-xs text-blue-600">Total</p></div>
          </div>

          {!isReadOnlyForTeacher && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => markAll('PRESENT')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
                <Users size={13} /> Mark All Present
              </button>
              <button onClick={() => markAll('ABSENT')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                <Users size={13} /> Mark All Absent
              </button>
              <button onClick={resetAll} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <RotateCcw size={13} /> Reset
              </button>
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden mb-5">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading students…</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No students found for Std {className}-{section}</div>
        ) : (
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-12 bg-[#0B2447] text-white px-4 py-3 text-xs font-semibold">
              <div className="col-span-1">#</div>
              <div className="col-span-2">Roll</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-5 text-center">Attendance</div>
            </div>
            {students.map((s, i) => {
              const cur = records[s.id] || 'PRESENT'
              const was = existingAtt[s.id]
              return (
                <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-12 items-center px-4 py-3 hover:bg-gov-bg">
                  <div className="col-span-1 text-xs text-gray-400">{i + 1}</div>
                  <div className="col-span-2 font-mono text-xs text-gray-600">{s.rollNumber}</div>
                  <div className="col-span-4">
                    <p className="text-sm font-semibold text-gray-800">{s.fullName}</p>
                    {was && <p className="text-xs text-gray-400">Prev: {was}</p>}
                  </div>
                  <div className="col-span-5 flex items-center justify-end gap-1.5 flex-wrap">
                    <button disabled={isReadOnlyForTeacher} onClick={() => toggle(s.id, 'PRESENT')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${cur === 'PRESENT' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-emerald-50'}`}>
                      <CheckCircle size={13} /> P
                    </button>
                    <button disabled={isReadOnlyForTeacher} onClick={() => toggle(s.id, 'ABSENT')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${cur === 'ABSENT' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-red-50'}`}>
                      <XCircle size={13} /> A
                    </button>
                    <button disabled={isReadOnlyForTeacher} onClick={() => toggle(s.id, 'LEAVE')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${cur === 'LEAVE' ? 'bg-purple-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-purple-50'}`}>
                      <CalendarOff size={13} /> Lv
                    </button>
                    <button disabled={isReadOnlyForTeacher} onClick={() => toggle(s.id, 'LATE')}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${cur === 'LATE' ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-amber-50'}`}>
                      <Clock size={13} /> L
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {students.length > 0 && !isReadOnlyForTeacher && (
        <div className="flex justify-end">
          <button onClick={() => setConfirmOpen(true)} disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm ${saved ? 'bg-emerald-500 text-white' : 'bg-[#0B2447] text-white hover:bg-[#163d6a]'} disabled:opacity-60`}>
            {saved ? <><CheckCircle size={16} /> Saved!</> : saving ? 'Saving…' : <><Save size={16} /> Save Attendance</>}
          </button>
        </div>
      )}

      <AnimatePresence>
        {confirmOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[#0B2447]">Confirm Attendance</h3>
                <button onClick={() => setConfirmOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                You are submitting attendance for Std {className}-{section} on {date} — {present} Present, {absent} Absent, {leave} Leave, {late} Late. This will be saved permanently and notified to the Headmaster.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button onClick={submit} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#0B2447] hover:bg-[#163d6a]">Confirm & Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
