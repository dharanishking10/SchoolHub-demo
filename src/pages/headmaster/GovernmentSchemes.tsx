import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, Search, Download, X, CheckCircle, AlertCircle, Gift } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const SCHEME_NAMES = ['Free Uniform', 'Free Textbook', 'Free Notebook', 'Free Bicycle', 'Free Laptop', 'Scholarship']
const STATUSES = ['PENDING', 'DISTRIBUTED', 'CANCELLED']
const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  DISTRIBUTED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-600',
}

interface Student { id: number; fullName: string; rollNumber: string; className: string; section: string }
interface Scheme {
  id: number
  studentId: number
  student: { fullName: string; rollNumber: string }
  className: string
  section: string
  academicYear: string
  schemeName: string
  distributionDate: string
  status: string
  remarks: string
}

const EMPTY_FORM = {
  studentId: '', className: '', section: '', academicYear: '',
  schemeName: '', distributionDate: '', status: 'PENDING', remarks: '',
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447] transition-all'

export default function GovernmentSchemes() {
  const { token } = useAuth()
  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Scheme | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [toast, setToast] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [filterScheme, setFilterScheme] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterYear, setFilterYear] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchSchemes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterScheme) params.set('schemeName', filterScheme)
      if (filterStatus) params.set('status', filterStatus)
      if (filterYear) params.set('academicYear', filterYear)
      const res = await fetch(`/api/schemes?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      if (json.success) setSchemes(json.data.schemes)
    } finally {
      setLoading(false)
    }
  }, [token, search, filterScheme, filterStatus, filterYear])

  useEffect(() => { fetchSchemes() }, [fetchSchemes])

  useEffect(() => {
    fetch('/api/students', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setStudents(d.data.students || d.data || []) })
      .catch(() => {})
  }, [token])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (s: Scheme) => {
    setEditing(s)
    setForm({
      studentId: String(s.studentId),
      className: s.className,
      section: s.section,
      academicYear: s.academicYear,
      schemeName: s.schemeName,
      distributionDate: s.distributionDate || '',
      status: s.status,
      remarks: s.remarks || '',
    })
    setFormError('')
    setShowModal(true)
  }

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value)
    const stu = students.find(s => s.id === id)
    setForm(f => ({
      ...f,
      studentId: e.target.value,
      className: stu?.className || f.className,
      section: stu?.section || f.section,
    }))
  }

  const validateForm = () => {
    if (!form.studentId) return 'Please select a student.'
    if (!form.schemeName) return 'Please select a scheme.'
    if (!form.academicYear.trim()) return 'Academic Year is required.'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateForm()
    if (err) { setFormError(err); return }
    setSubmitting(true); setFormError('')
    try {
      const url = editing ? `/api/schemes/${editing.id}` : '/api/schemes'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, studentId: Number(form.studentId) }),
      })
      const json = await res.json()
      if (json.success) {
        setShowModal(false)
        fetchSchemes()
        showToast(editing ? 'Scheme updated.' : 'Scheme added.')
      } else {
        setFormError(json.message || 'Failed to save.')
      }
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/schemes/${deleteId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      setDeleteId(null)
      fetchSchemes()
      showToast('Scheme deleted.')
    } catch {
      showToast('Delete failed.')
    }
  }

  const handleExport = () => {
    fetch('/api/schemes/export', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'government-schemes.csv'; a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => showToast('Export failed. Please try again.'))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg"
          >
            <CheckCircle size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Government Schemes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage Tamil Nadu Government welfare scheme distributions</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0B2447] text-white text-sm font-semibold rounded-xl hover:bg-[#163d6a] transition-colors shadow-sm">
            <Plus size={16} /> Add Scheme
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl border border-gov-border shadow-sm p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Search student…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447] transition-all"
            />
          </div>
          <select value={filterScheme} onChange={e => setFilterScheme(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447]">
            <option value="">All Schemes</option>
            {SCHEME_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447]">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="text" placeholder="Academic Year e.g. 2025-2026" value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447]"
          />
        </div>
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gov-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B2447] text-white">
                <th className="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider">Student</th>
                <th className="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider">Class</th>
                <th className="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider">Scheme</th>
                <th className="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider">Academic Year</th>
                <th className="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider">Distribution Date</th>
                <th className="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-left font-semibold text-xs uppercase tracking-wider">Remarks</th>
                <th className="px-4 py-3.5 text-right font-semibold text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : schemes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <Gift size={40} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 font-medium">No schemes found</p>
                    <p className="text-gray-300 text-xs mt-1">Add a scheme to get started</p>
                  </td>
                </tr>
              ) : schemes.map((s, idx) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                  className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800">{s.student.fullName}</p>
                    <p className="text-xs text-gray-400">{s.student.rollNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.className} – {s.section}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                      <Gift size={11} /> {s.schemeName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.academicYear}</td>
                  <td className="px-4 py-3 text-gray-500">{s.distributionDate || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLE[s.status] || 'bg-gray-100 text-gray-600'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{s.remarks || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(s)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#0B2447] hover:bg-blue-50 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setDeleteId(s.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && schemes.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {schemes.length} record{schemes.length !== 1 ? 's' : ''}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 bg-[#0B2447]">
                  <h2 className="text-white font-bold text-base">{editing ? 'Edit Scheme' : 'Add Government Scheme'}</h2>
                  <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Student<span className="text-red-500 ml-0.5">*</span></label>
                    <select value={form.studentId} onChange={handleStudentChange} className={inputCls}>
                      <option value="">Select Student</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.rollNumber}) — {s.className}-{s.section}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Class</label>
                      <input type="text" value={form.className}
                        onChange={e => setForm(f => ({ ...f, className: e.target.value }))}
                        placeholder="e.g. 10" className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Section</label>
                      <input type="text" value={form.section}
                        onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                        placeholder="e.g. A" className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Academic Year<span className="text-red-500 ml-0.5">*</span></label>
                    <input type="text" value={form.academicYear}
                      onChange={e => setForm(f => ({ ...f, academicYear: e.target.value }))}
                      placeholder="2025-2026" className={inputCls} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Scheme<span className="text-red-500 ml-0.5">*</span></label>
                    <select value={form.schemeName} onChange={e => setForm(f => ({ ...f, schemeName: e.target.value }))} className={inputCls}>
                      <option value="">Select Scheme</option>
                      {SCHEME_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Distribution Date</label>
                      <input type="date" value={form.distributionDate}
                        onChange={e => setForm(f => ({ ...f, distributionDate: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Remarks</label>
                    <input type="text" value={form.remarks}
                      onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                      placeholder="Optional notes…" className={inputCls} />
                  </div>

                  {formError && (
                    <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
                      <AlertCircle size={15} className="shrink-0 mt-0.5" /> {formError}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting}
                      className="px-5 py-2 bg-[#0B2447] text-white text-sm font-semibold rounded-xl hover:bg-[#163d6a] transition-colors disabled:opacity-60 shadow-sm">
                      {submitting ? 'Saving…' : editing ? 'Update' : 'Add Scheme'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId !== null && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={22} className="text-red-600" />
                </div>
                <h3 className="text-base font-bold text-gray-800 mb-1">Delete Scheme?</h3>
                <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteId(null)}
                    className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleDelete}
                    className="flex-1 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
