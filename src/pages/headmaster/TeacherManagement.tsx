import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Edit2, Trash2, X, Eye, EyeOff, Copy, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Teacher {
  id: number; fullName: string; employeeId: string; mobile: string
  email?: string; subject: string; username: string; status: string; createdAt: string
}

const SUBJECTS = ['Mathematics', 'Science', 'Tamil', 'English', 'Social Science', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'Commerce', 'Economics', 'History']
const EMPTY_FORM = { fullName: '', employeeId: '', mobile: '', email: '', subject: '', username: '', status: 'ACTIVE' }

export default function TeacherManagement() {
  const { token } = useAuth()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<Teacher | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [genPassword, setGenPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const LIMIT = 8

  const fetchTeachers = useCallback(() => {
    setLoading(true)
    fetch(`/api/teachers?search=${encodeURIComponent(search)}&page=${page}&limit=${LIMIT}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) { setTeachers(d.data.teachers); setTotal(d.data.total) } })
      .finally(() => setLoading(false))
  }, [token, search, page])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setGenPassword(''); setError(''); setModal('create') }
  const openEdit = (t: Teacher) => { setSelected(t); setForm({ fullName: t.fullName, employeeId: t.employeeId, mobile: t.mobile, email: t.email || '', subject: t.subject, username: t.username, status: t.status }); setError(''); setModal('edit') }
  const openDelete = (t: Teacher) => { setSelected(t); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null); setGenPassword(''); setError('') }

  const handleCreate = async () => {
    if (!form.fullName || !form.employeeId || !form.mobile || !form.subject || !form.username) { setError('Please fill all required fields.'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/teachers', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    const json = await res.json()
    setSaving(false)
    if (json.success) { setGenPassword(json.data.generatedPassword); fetchTeachers() }
    else setError(json.message || 'Failed to create teacher')
  }

  const handleEdit = async () => {
    if (!selected) return
    setSaving(true); setError('')
    const res = await fetch(`/api/teachers/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    const json = await res.json()
    setSaving(false)
    if (json.success) { closeModal(); fetchTeachers() }
    else setError(json.message || 'Failed to update teacher')
  }

  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    await fetch(`/api/teachers/${selected.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setSaving(false); closeModal(); fetchTeachers()
  }

  const copyPass = () => { navigator.clipboard.writeText(genPassword); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const totalPages = Math.ceil(total / LIMIT)

  const InputField = ({ label, name, type = 'text', required = false, placeholder = '' }: { label: string; name: keyof typeof form; type?: string; required?: boolean; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447]" />
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Teacher Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} teacher{total !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] transition-colors shadow-sm">
          <Plus size={16} className="text-secondary" /> Add Teacher
        </button>
      </motion.div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-4 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search by name, employee ID or subject…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B2447] text-white">
                {['#', 'Name', 'Emp ID', 'Subject', 'Mobile', 'Username', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {[...Array(8)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                  </tr>
                ))
              ) : teachers.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No teachers found</td></tr>
              ) : teachers.map((t, i) => (
                <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="border-t border-gray-100 hover:bg-gov-bg transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * LIMIT + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{t.fullName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.employeeId}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{t.subject}</td>
                  <td className="px-4 py-3 text-gray-600">{t.mobile}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.username}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${t.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => openDelete(t)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"><ChevronLeft size={16} /></button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === i + 1 ? 'bg-[#0B2447] text-white' : 'hover:bg-gray-200 text-gray-600'}`}>{i + 1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40 transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#0B2447] rounded-t-2xl">
                <h2 className="text-white font-bold text-lg">{modal === 'create' ? 'Add New Teacher' : 'Edit Teacher'}</h2>
                <button onClick={closeModal} className="text-white/70 hover:text-white"><X size={20} /></button>
              </div>

              {genPassword ? (
                <div className="p-6">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={28} className="text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Teacher Created!</h3>
                    <p className="text-gray-500 text-sm mt-1">Share the auto-generated password securely.</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <p className="text-xs font-semibold text-amber-700 mb-2">Auto-generated Password</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white border border-amber-200 px-3 py-2 rounded-lg text-sm font-mono text-gray-800">
                        {showPass ? genPassword : '•'.repeat(genPassword.length)}
                      </code>
                      <button onClick={() => setShowPass(s => !s)} className="p-2 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      <button onClick={copyPass} className="p-2 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors">{copied ? <CheckCircle size={16} className="text-emerald-600" /> : <Copy size={16} />}</button>
                    </div>
                  </div>
                  <button onClick={closeModal} className="w-full py-2.5 bg-[#0B2447] text-white rounded-xl font-semibold text-sm hover:bg-[#163d6a] transition-colors">Done</button>
                </div>
              ) : (
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><InputField label="Full Name" name="fullName" required placeholder="e.g. A. Muruganantham" /></div>
                    <InputField label="Employee ID" name="employeeId" required placeholder="EMP001" />
                    <InputField label="Mobile Number" name="mobile" type="tel" required placeholder="9876543210" />
                    <InputField label="Email" name="email" type="email" placeholder="optional" />
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Subject<span className="text-red-500 ml-0.5">*</span></label>
                      <select value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447]">
                        <option value="">Select Subject</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <InputField label="Username" name="username" required placeholder="teacher_name" />
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447]">
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>
                  {modal === 'create' && <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">🔐 Password will be auto-generated and shown after creation.</p>}
                  {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                  <div className="flex gap-3 pt-2">
                    <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={modal === 'create' ? handleCreate : handleEdit} disabled={saving}
                      className="flex-1 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] transition-colors disabled:opacity-60">
                      {saving ? 'Saving…' : modal === 'create' ? 'Create Teacher' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {modal === 'delete' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Delete Teacher?</h3>
              <p className="text-gray-500 text-sm mb-6">This will permanently remove <span className="font-semibold text-gray-700">{selected.fullName}</span> from the system.</p>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
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
