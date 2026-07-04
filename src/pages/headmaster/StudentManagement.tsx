import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Edit2, Trash2, X, Eye, EyeOff, Copy, CheckCircle, ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Student {
  id: number; admissionNumber?: string; fullName: string; gender: string
  dateOfBirth?: string; fatherName?: string; motherName?: string; mobile?: string
  address?: string; className: string; section: string; rollNumber: string
  username?: string; status: string; createdAt: string
}

const CLASSES = ['VI','VII','VIII','IX','X','XI','XII']
const SECTIONS = ['A','B']
const EMPTY_FORM = { fullName: '', gender: 'MALE', dateOfBirth: '', fatherName: '', motherName: '', mobile: '', address: '', className: 'VI', section: 'A', rollNumber: '', status: 'ACTIVE' }
const LIMIT = 10

export default function StudentManagement() {
  const { token } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<Student | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [credentials, setCredentials] = useState<{ password: string; username: string } | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchStudents = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ search, page: String(page), limit: String(LIMIT) })
    if (filterClass) params.append('className', filterClass)
    if (filterSection) params.append('section', filterSection)
    if (filterStatus) params.append('status', filterStatus)
    fetch(`/api/students?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) { setStudents(d.data.students); setTotal(d.data.total) } })
      .finally(() => setLoading(false))
  }, [token, search, page, filterClass, filterSection, filterStatus])

  useEffect(() => { setPage(1) }, [search, filterClass, filterSection, filterStatus])
  useEffect(() => { fetchStudents() }, [fetchStudents])

  const openCreate = () => { setForm({ ...EMPTY_FORM }); setCredentials(null); setError(''); setModal('create') }
  const openEdit = (s: Student) => { setSelected(s); setForm({ fullName: s.fullName, gender: s.gender, dateOfBirth: s.dateOfBirth || '', fatherName: s.fatherName || '', motherName: s.motherName || '', mobile: s.mobile || '', address: s.address || '', className: s.className, section: s.section, rollNumber: s.rollNumber, status: s.status }); setError(''); setModal('edit') }
  const openDelete = (s: Student) => { setSelected(s); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null); setCredentials(null); setError('') }

  const handleCreate = async () => {
    if (!form.fullName || !form.gender || !form.className || !form.section || !form.rollNumber) { setError('Please fill all required fields.'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    const json = await res.json()
    setSaving(false)
    if (json.success) { setCredentials({ password: json.data.generatedPassword, username: json.data.generatedUsername }); fetchStudents() }
    else setError(json.message || 'Failed to create student')
  }

  const handleEdit = async () => {
    if (!selected) return
    setSaving(true); setError('')
    const res = await fetch(`/api/students/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    const json = await res.json()
    setSaving(false)
    if (json.success) { closeModal(); fetchStudents() }
    else setError(json.message || 'Failed to update')
  }

  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    await fetch(`/api/students/${selected.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setSaving(false); closeModal(); fetchStudents()
  }

  const exportCSV = () => {
    const headers = ['Admission No', 'Full Name', 'Gender', 'DOB', 'Father Name', 'Mother Name', 'Mobile', 'Class', 'Section', 'Roll No', 'Username', 'Status']
    const rows = students.map(s => [s.admissionNumber || '', s.fullName, s.gender, s.dateOfBirth || '', s.fatherName || '', s.motherName || '', s.mobile || '', s.className, s.section, s.rollNumber, s.username || '', s.status])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `students_${filterClass || 'all'}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const copyText = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const totalPages = Math.ceil(total / LIMIT)

  const Field = ({ label, name, type = 'text', required = false, placeholder = '' }: { label: string; name: keyof typeof form; type?: string; required?: boolean; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input type={type} value={form[name] as string} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447]" />
    </div>
  )

  const Select = ({ label, name, options, required = false }: { label: string; name: keyof typeof form; options: { value: string; label: string }[]; required?: boolean }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select value={form[name] as string} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447]">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Student Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} student{total !== 1 ? 's' : ''} registered</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
            <Download size={15} className="text-[#0B2447]" /> Export CSV
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] transition-colors shadow-sm">
            <Plus size={16} className="text-secondary" /> Add Student
          </button>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-4 mb-5 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, admission no, roll no…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]" />
          </div>
          <button onClick={() => setShowFilters(f => !f)} className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-[#0B2447] text-white border-[#0B2447]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Filter size={15} /> Filters
          </button>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 overflow-hidden">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Class</label>
                <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]">
                  <option value="">All Classes</option>
                  {CLASSES.map(c => <option key={c} value={c}>Standard {c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Section</label>
                <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]">
                  <option value="">All Sections</option>
                  {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]">
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B2447] text-white">
                {['#', 'Adm No', 'Full Name', 'Gender', 'Class', 'Roll No', 'Father Name', 'Mobile', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i} className="border-t border-gray-100">
                  {[...Array(10)].map((_, j) => <td key={j} className="px-3 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : students.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">No students found</td></tr>
              ) : students.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-t border-gray-100 hover:bg-gov-bg transition-colors">
                  <td className="px-3 py-3 text-gray-400 text-xs">{(page - 1) * LIMIT + i + 1}</td>
                  <td className="px-3 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{s.admissionNumber || '—'}</td>
                  <td className="px-3 py-3 font-medium text-gray-800 whitespace-nowrap">{s.fullName}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${s.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {s.gender === 'MALE' ? 'Boy' : 'Girl'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">Std {s.className}-{s.section}</td>
                  <td className="px-3 py-3 font-mono text-xs text-gray-600">{s.rollNumber}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{s.fatherName || '—'}</td>
                  <td className="px-3 py-3 text-gray-600">{s.mobile || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Edit2 size={13} /></button>
                      <button onClick={() => openDelete(s)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40"><ChevronLeft size={16} /></button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                const pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page + i - 2
                if (pg > totalPages) return null
                return <button key={pg} onClick={() => setPage(pg)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === pg ? 'bg-[#0B2447] text-white' : 'hover:bg-gray-200 text-gray-600'}`}>{pg}</button>
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 bg-[#0B2447] rounded-t-2xl sticky top-0 z-10">
                <h2 className="text-white font-bold text-lg">{modal === 'create' ? 'Admit New Student' : 'Edit Student'}</h2>
                <button onClick={closeModal} className="text-white/70 hover:text-white"><X size={20} /></button>
              </div>

              {credentials ? (
                <div className="p-6">
                  <div className="text-center mb-5">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={28} className="text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-lg">Student Admitted!</h3>
                    <p className="text-gray-500 text-sm mt-1">Share these login credentials with the student/parent securely.</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 mb-5">
                    <div>
                      <p className="text-xs font-semibold text-amber-700 mb-1">Username</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white border border-amber-200 px-3 py-2 rounded-lg text-sm font-mono text-gray-800">{credentials.username}</code>
                        <button onClick={() => copyText(credentials.username)} className="p-2 rounded-lg hover:bg-amber-100 text-amber-700">
                          {copied ? <CheckCircle size={15} className="text-emerald-600" /> : <Copy size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-700 mb-1">Auto-generated Password</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white border border-amber-200 px-3 py-2 rounded-lg text-sm font-mono text-gray-800">
                          {showPass ? credentials.password : '•'.repeat(credentials.password.length)}
                        </code>
                        <button onClick={() => setShowPass(p => !p)} className="p-2 rounded-lg hover:bg-amber-100 text-amber-700">{showPass ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                        <button onClick={() => copyText(credentials.password)} className="p-2 rounded-lg hover:bg-amber-100 text-amber-700"><Copy size={15} /></button>
                      </div>
                    </div>
                  </div>
                  <button onClick={closeModal} className="w-full py-2.5 bg-[#0B2447] text-white rounded-xl font-semibold text-sm hover:bg-[#163d6a]">Done</button>
                </div>
              ) : (
                <div className="p-6">
                  {/* Basic Info */}
                  <p className="text-xs font-bold text-[#0B2447] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#0B2447] text-white rounded-full flex items-center justify-center text-xs">1</span> Basic Information
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div className="sm:col-span-2"><Field label="Full Name" name="fullName" required placeholder="e.g. Arjun Kumar" /></div>
                    <Select label="Gender" name="gender" required options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }]} />
                    <Field label="Date of Birth" name="dateOfBirth" type="date" />
                  </div>

                  {/* Parent Info */}
                  <p className="text-xs font-bold text-[#0B2447] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#0B2447] text-white rounded-full flex items-center justify-center text-xs">2</span> Parent Information
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <Field label="Father Name" name="fatherName" placeholder="Father's full name" />
                    <Field label="Mother Name" name="motherName" placeholder="Mother's full name" />
                    <Field label="Mobile Number" name="mobile" type="tel" placeholder="9876543210" />
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                      <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447] resize-none" />
                    </div>
                  </div>

                  {/* Academic Info */}
                  <p className="text-xs font-bold text-[#0B2447] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-[#0B2447] text-white rounded-full flex items-center justify-center text-xs">3</span> Academic Details
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <Select label="Class" name="className" required options={CLASSES.map(c => ({ value: c, label: `Std ${c}` }))} />
                    <Select label="Section" name="section" required options={SECTIONS.map(s => ({ value: s, label: `Section ${s}` }))} />
                    <Field label="Roll Number" name="rollNumber" required placeholder="e.g. S016" />
                    <Select label="Status" name="status" options={[{ value: 'ACTIVE', label: 'Active' }, { value: 'INACTIVE', label: 'Inactive' }]} />
                  </div>

                  {modal === 'create' && <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg mb-4">🔐 Username and password will be auto-generated and shown after admission.</p>}
                  {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

                  <div className="flex gap-3">
                    <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={modal === 'create' ? handleCreate : handleEdit} disabled={saving}
                      className="flex-1 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] disabled:opacity-60">
                      {saving ? 'Saving…' : modal === 'create' ? 'Admit Student' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {modal === 'delete' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-500" /></div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Remove Student?</h3>
              <p className="text-gray-500 text-sm mb-6">This will permanently remove <span className="font-semibold text-gray-700">{selected.fullName}</span> ({selected.admissionNumber}) from records.</p>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
                  {saving ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
