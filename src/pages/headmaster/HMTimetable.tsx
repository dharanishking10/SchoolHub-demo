import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plus, Edit2, Trash2, X, Users, BookOpen } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface TEntry {
  id: number; className: string; section: string; day: string; period: number
  subject: string; roomNumber: string; startTime: string; endTime: string
  teacher: { id: number; fullName: string; subject: string; employeeId: string }
}
interface Teacher { id: number; fullName: string; employeeId: string; subject: string }

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const DAY_LABELS: Record<string, string> = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri' }
const PERIOD_TIMES: Record<number, string> = { 1: '8:00–8:45', 2: '8:45–9:30', 3: '9:45–10:30', 4: '10:30–11:15', 5: '11:30–12:15', 6: '12:15–1:00' }
const PERIODS = [1, 2, 3, 4, 5, 6]
const CLASSES = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const SECTIONS = ['A', 'B']
const SUBJECTS = ['Mathematics', 'Science', 'Tamil', 'English', 'Social Science', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'Commerce', 'Economics', 'History']

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: 'bg-blue-50 border-blue-200 text-blue-800',
  Science: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  Tamil: 'bg-orange-50 border-orange-200 text-orange-800',
  English: 'bg-violet-50 border-violet-200 text-violet-800',
  'Social Science': 'bg-amber-50 border-amber-200 text-amber-800',
  'Computer Science': 'bg-cyan-50 border-cyan-200 text-cyan-800',
  Physics: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  Chemistry: 'bg-pink-50 border-pink-200 text-pink-800',
  Biology: 'bg-teal-50 border-teal-200 text-teal-800',
}

const cellColor = (subject: string) => SUBJECT_COLORS[subject] || 'bg-gray-50 border-gray-200 text-gray-800'

const EMPTY_FORM = { teacherId: '', day: 'MONDAY', period: 1, className: 'X', section: 'A', subject: '', roomNumber: '' }

export default function HMTimetable() {
  const { token } = useAuth()
  const [view, setView] = useState<'teacher' | 'class'>('teacher')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedClass, setSelectedClass] = useState('X')
  const [selectedSection, setSelectedSection] = useState('A')
  const [entries, setEntries] = useState<TEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<TEntry | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()

  // Load all teachers for dropdown
  useEffect(() => {
    fetch('/api/teachers?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setTeachers(d.data.teachers) })
  }, [token])

  const fetchEntries = useCallback(() => {
    const params = new URLSearchParams()
    if (view === 'teacher' && selectedTeacherId) params.set('teacherId', selectedTeacherId)
    if (view === 'class') { params.set('className', selectedClass); params.set('section', selectedSection) }
    if (!params.toString()) { setEntries([]); return }
    setLoading(true)
    fetch(`/api/timetable?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setEntries(d.data) })
      .finally(() => setLoading(false))
  }, [token, view, selectedTeacherId, selectedClass, selectedSection])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const getEntry = (day: string, period: number) => entries.find(e => e.day === day && e.period === period)

  const openAdd = (day?: string, period?: number) => {
    const prefillTeacher = view === 'teacher' && selectedTeacherId ? selectedTeacherId : ''
    const prefillClass = view === 'class' ? selectedClass : 'X'
    const prefillSection = view === 'class' ? selectedSection : 'A'
    setForm({ ...EMPTY_FORM, teacherId: prefillTeacher, day: day || 'MONDAY', period: period || 1, className: prefillClass, section: prefillSection })
    setError(''); setModal('add')
  }
  const openEdit = (e: TEntry) => {
    setSelected(e)
    setForm({ teacherId: String(e.teacher.id), day: e.day, period: e.period, className: e.className, section: e.section, subject: e.subject, roomNumber: e.roomNumber || '' })
    setError(''); setModal('edit')
  }
  const openDelete = (e: TEntry) => { setSelected(e); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null); setError('') }

  const handleSave = async () => {
    if (!form.teacherId) { setError('Please select a teacher'); return }
    if (!form.subject) { setError('Please select a subject'); return }
    setSaving(true); setError('')
    try {
      const url = modal === 'edit' && selected ? `/api/timetable/${selected.id}` : '/api/timetable'
      const method = modal === 'edit' ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, teacherId: Number(form.teacherId), period: Number(form.period) }),
      })
      const json = await res.json()
      if (json.success) { closeModal(); fetchEntries() }
      else setError(json.message || 'Failed to save entry')
    } catch { setError('Network error. Please try again.') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await fetch(`/api/timetable/${selected.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      closeModal(); fetchEntries()
    } catch { /* ignore */ }
    finally { setSaving(false) }
  }

  const hasFilter = view === 'teacher' ? !!selectedTeacherId : true

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Timetable Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">View and manage all class schedules</p>
        </div>
        {hasFilter && (
          <button onClick={() => openAdd()} className="flex items-center gap-2 px-4 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] transition-colors shadow-sm">
            <Plus size={16} className="text-secondary" /> Add Entry
          </button>
        )}
      </motion.div>

      {/* View Tabs + Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-4 mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-4">
          <button onClick={() => setView('teacher')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'teacher' ? 'bg-white text-[#0B2447] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Users size={14} /> By Teacher
          </button>
          <button onClick={() => setView('class')} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'class' ? 'bg-white text-[#0B2447] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <BookOpen size={14} /> By Class
          </button>
        </div>

        {view === 'teacher' ? (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Select Teacher</label>
            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20">
              <option value="">— Choose a teacher —</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.subject})</option>)}
            </select>
          </div>
        ) : (
          <div className="flex gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Class</label>
              <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20">
                {CLASSES.map(c => <option key={c} value={c}>Std {c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Section</label>
              <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20">
                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Timetable Grid */}
      <motion.div key={`${view}-${selectedTeacherId}-${selectedClass}-${selectedSection}`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden">
        {!hasFilter ? (
          <div className="p-12 text-center text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-25" />
            <p className="font-semibold">Select a teacher to view their timetable</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-gray-400">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse mb-3" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-[#0B2447] text-white">
                  <th className="px-4 py-3 text-left text-xs font-semibold w-28">Period</th>
                  {DAYS.map(d => (
                    <th key={d} className={`px-3 py-3 text-center text-xs font-semibold ${d === today ? 'text-secondary' : ''}`}>
                      {DAY_LABELS[d]}{d === today ? ' ★' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(p => (
                  <tr key={p} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-gray-600">Period {p}</p>
                      <p className="text-xs text-gray-400">{PERIOD_TIMES[p]}</p>
                    </td>
                    {DAYS.map(d => {
                      const e = getEntry(d, p)
                      return (
                        <td key={d} className={`px-2 py-2 ${d === today ? 'bg-amber-50/60' : 'hover:bg-gray-50'} transition-colors`}>
                          {e ? (
                            <div className={`group relative rounded-xl p-2.5 border min-h-[60px] ${cellColor(e.subject)}`}>
                              {view === 'teacher' ? (
                                <>
                                  <p className="text-xs font-bold">Std {e.className}-{e.section}</p>
                                  <p className="text-xs opacity-80 mt-0.5">{e.subject}</p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs font-bold">{e.subject}</p>
                                  <p className="text-xs opacity-75 mt-0.5">{e.teacher.fullName}</p>
                                </>
                              )}
                              {e.roomNumber && <p className="text-xs opacity-60 mt-0.5">{e.roomNumber}</p>}
                              <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-0.5">
                                <button onClick={() => openEdit(e)} title="Edit"
                                  className="p-1 rounded-md bg-white/80 shadow-sm hover:bg-white text-blue-600 transition-colors">
                                  <Edit2 size={11} />
                                </button>
                                <button onClick={() => openDelete(e)} title="Delete"
                                  className="p-1 rounded-md bg-white/80 shadow-sm hover:bg-white text-red-500 transition-colors">
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => openAdd(d, p)}
                              className="w-full min-h-[60px] rounded-xl border-2 border-dashed border-gray-200 text-gray-300 hover:border-[#0B2447]/30 hover:text-[#0B2447]/40 transition-all flex items-center justify-center">
                              <Plus size={16} />
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {hasFilter && !loading && entries.length === 0 && (
          <div className="p-10 text-center text-gray-400 border-t border-gray-50">
            <Calendar size={36} className="mx-auto mb-2 opacity-25" />
            <p className="font-semibold text-sm">No timetable entries found</p>
            <p className="text-xs mt-1">Click any "+" cell or the Add Entry button above</p>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#0B2447] rounded-t-2xl">
                <h2 className="text-white font-bold text-lg">{modal === 'add' ? 'Add Timetable Entry' : 'Edit Entry'}</h2>
                <button onClick={closeModal} className="text-white/70 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                {/* Teacher */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Teacher <span className="text-red-500">*</span></label>
                  <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30">
                    <option value="">Select Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName} · {t.subject}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Day <span className="text-red-500">*</span></label>
                    <select value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30">
                      {DAYS.map(d => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Period <span className="text-red-500">*</span></label>
                    <select value={form.period} onChange={e => setForm(f => ({ ...f, period: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30">
                      {PERIODS.map(p => <option key={p} value={p}>P{p} · {PERIOD_TIMES[p]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Class <span className="text-red-500">*</span></label>
                    <select value={form.className} onChange={e => setForm(f => ({ ...f, className: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30">
                      {CLASSES.map(c => <option key={c} value={c}>Std {c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Section <span className="text-red-500">*</span></label>
                    <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30">
                      {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Subject <span className="text-red-500">*</span></label>
                    <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30">
                      <option value="">Select Subject</option>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Room Number <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="text" value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))}
                      placeholder="e.g. Room 101"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30" />
                  </div>
                </div>
                {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] disabled:opacity-60">
                    {saving ? 'Saving…' : modal === 'edit' ? 'Save Changes' : 'Add Entry'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {modal === 'delete' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Delete Entry?</h3>
              <p className="text-gray-500 text-sm mb-1">
                <span className="font-semibold">{selected.teacher.fullName}</span>
              </p>
              <p className="text-gray-500 text-sm mb-6">
                {selected.day.charAt(0) + selected.day.slice(1).toLowerCase()} · P{selected.period} · Std {selected.className}-{selected.section} · {selected.subject}
              </p>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} disabled={saving}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
                  {saving ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
