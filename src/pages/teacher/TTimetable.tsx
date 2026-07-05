import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plus, Edit2, Trash2, X, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface TEntry {
  id: number; className: string; section: string; day: string; period: number
  subject: string; roomNumber: string; startTime: string; endTime: string
  teacher: { id: number; fullName: string; subject: string }
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']
const DAY_LABELS: Record<string, string> = { MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri' }
const PERIOD_TIMES: Record<number, string> = { 1: '8:00–8:45', 2: '8:45–9:30', 3: '9:45–10:30', 4: '10:30–11:15', 5: '11:30–12:15', 6: '12:15–1:00' }
const PERIODS = [1, 2, 3, 4, 5, 6]
const CLASSES = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const SECTIONS = ['A', 'B']
const SUBJECTS = ['Mathematics', 'Science', 'Tamil', 'English', 'Social Science', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'Commerce', 'Economics', 'History']

const EMPTY_FORM = { day: 'MONDAY', period: 1, className: 'X', section: 'A', subject: '', roomNumber: '' }

export default function TTimetable() {
  const { token } = useAuth()
  const [entries, setEntries] = useState<TEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<TEntry | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()

  const fetchEntries = useCallback(() => {
    setLoading(true)
    fetch('/api/timetable', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setEntries(d.data) })
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const getEntry = (day: string, period: number) => entries.find(e => e.day === day && e.period === period)
  const todayEntries = entries.filter(e => e.day === today).sort((a, b) => a.period - b.period)

  const openAdd = (day?: string, period?: number) => {
    setForm({ ...EMPTY_FORM, day: day || 'MONDAY', period: period || 1 })
    setError(''); setModal('add')
  }
  const openEdit = (e: TEntry) => {
    setSelected(e)
    setForm({ day: e.day, period: e.period, className: e.className, section: e.section, subject: e.subject, roomNumber: e.roomNumber || '' })
    setError(''); setModal('edit')
  }
  const openDelete = (e: TEntry) => { setSelected(e); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null); setError('') }

  const handleSave = async () => {
    if (!form.subject) { setError('Please select a subject'); return }
    setSaving(true); setError('')
    try {
      const url = modal === 'edit' && selected ? `/api/timetable/${selected.id}` : '/api/timetable'
      const method = modal === 'edit' ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, period: Number(form.period) }),
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

  const EntryForm = () => (
    <div className="space-y-4">
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
            {PERIODS.map(p => <option key={p} value={p}>Period {p} ({PERIOD_TIMES[p]})</option>)}
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
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">My Timetable</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your weekly class schedule</p>
        </div>
        <button onClick={() => openAdd()} className="flex items-center gap-2 px-4 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] transition-colors shadow-sm">
          <Plus size={16} className="text-secondary" /> Add Entry
        </button>
      </motion.div>

      {/* Today's Schedule */}
      {!loading && todayEntries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-[#0B2447] rounded-2xl p-5 mb-6 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-secondary" />
            <h2 className="font-bold text-sm">Today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
            <span className="ml-auto text-xs text-white/50">{todayEntries.length} class{todayEntries.length !== 1 ? 'es' : ''}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {todayEntries.map(e => (
              <div key={e.id} className="bg-white/10 rounded-xl p-3">
                <p className="text-secondary text-xs font-bold">Period {e.period}</p>
                <p className="font-bold text-sm mt-0.5">Std {e.className}-{e.section}</p>
                <p className="text-white/70 text-xs">{e.subject}</p>
                <p className="text-white/50 text-xs">{PERIOD_TIMES[e.period]}{e.roomNumber ? ` · ${e.roomNumber}` : ''}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Weekly Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="h-6 bg-gray-100 rounded animate-pulse w-48 mx-auto mb-2" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-32 mx-auto" />
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
                            <div className="group relative bg-[#0B2447]/8 border border-[#0B2447]/15 rounded-xl p-2.5 min-h-[56px]">
                              <p className="text-xs font-bold text-[#0B2447]">Std {e.className}-{e.section}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{e.subject}</p>
                              {e.roomNumber && <p className="text-xs text-gray-400 mt-0.5">{e.roomNumber}</p>}
                              <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-0.5">
                                <button onClick={() => openEdit(e)} title="Edit"
                                  className="p-1 rounded-md bg-white/90 shadow-sm hover:bg-blue-50 text-blue-600 transition-colors">
                                  <Edit2 size={11} />
                                </button>
                                <button onClick={() => openDelete(e)} title="Delete"
                                  className="p-1 rounded-md bg-white/90 shadow-sm hover:bg-red-50 text-red-500 transition-colors">
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => openAdd(d, p)}
                              className="w-full min-h-[56px] rounded-xl border-2 border-dashed border-gray-200 text-gray-300 hover:border-[#0B2447]/30 hover:text-[#0B2447]/40 transition-all flex items-center justify-center">
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
        {!loading && entries.length === 0 && (
          <div className="p-12 text-center text-gray-400 border-t border-gray-50">
            <Calendar size={40} className="mx-auto mb-3 opacity-25" />
            <p className="font-semibold">No timetable entries yet</p>
            <p className="text-sm mt-1">Click any "+" cell or the Add Entry button to get started</p>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#0B2447] rounded-t-2xl">
                <h2 className="text-white font-bold text-lg">{modal === 'add' ? 'Add Timetable Entry' : 'Edit Entry'}</h2>
                <button onClick={closeModal} className="text-white/70 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6"><EntryForm /></div>
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
                <span className="font-semibold text-gray-700">{selected.day.charAt(0) + selected.day.slice(1).toLowerCase()}</span> · Period {selected.period}
              </p>
              <p className="text-gray-500 text-sm mb-6">Std {selected.className}-{selected.section} · {selected.subject}</p>
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
