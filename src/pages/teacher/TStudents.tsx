import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Edit2, Trash2, X, Eye, EyeOff, Copy, CheckCircle,
  ChevronLeft, ChevronRight, Filter, UserPlus, AlertCircle,
  Users, GraduationCap, UserCheck
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Student {
  id: number; admissionNumber?: string; fullName: string; gender: string
  dateOfBirth?: string; bloodGroup?: string; fatherName?: string; motherName?: string
  mobile?: string; address?: string; className: string; section: string
  rollNumber: string; username?: string; status: string; createdAt: string
}
interface Stats { total: number; boys: number; girls: number; active: number }

const CLASSES = ['VI','VII','VIII','IX','X','XI','XII']
const SECTIONS = ['A','B','C','D']
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']
const EMPTY_FORM = {
  fullName: '', gender: 'MALE', dateOfBirth: '', bloodGroup: '',
  fatherName: '', motherName: '', mobile: '', address: '',
  className: 'VI', section: 'A', rollNumber: '', status: 'ACTIVE',
}
const LIMIT = 10

const inp = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447] transition-all'

export default function TStudents() {
  const { token } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'view' | null>(null)
  const [selected, setSelected] = useState<Student | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchStats = useCallback(() => {
    fetch('/api/students/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setStats(d.data) })
  }, [token])

  const fetchStudents = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ search, page: String(page), limit: String(LIMIT) })
    if (filterClass) params.append('className', filterClass)
    if (filterSection) params.append('section', filterSection)
    fetch(`/api/students?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) { setStudents(d.data.students); setTotal(d.data.total) } })
      .finally(() => setLoading(false))
  }, [token, search, page, filterClass, filterSection])

  useEffect(() => { setPage(1) }, [search, filterClass, filterSection])
  useEffect(() => { fetchStudents() }, [fetchStudents])
  useEffect(() => { fetchStats() }, [fetchStats])

  const closeModal = () => { setModal(null); setSelected(null); setCredentials(null); setError('') }
  const openCreate = () => { setForm({ ...EMPTY_FORM }); setCredentials(null); setError(''); setModal('create') }
  const openView = (s: Student) => { setSelected(s); setModal('view') }
  const openEdit = (s: Student) => {
    setSelected(s)
    setForm({ fullName: s.fullName, gender: s.gender, dateOfBirth: s.dateOfBirth || '', bloodGroup: s.bloodGroup || '', fatherName: s.fatherName || '', motherName: s.motherName || '', mobile: s.mobile || '', address: s.address || '', className: s.className, section: s.section, rollNumber: s.rollNumber, status: s.status })
    setError(''); setModal('edit')
  }
  const openDelete = (s: Student) => { setSelected(s); setModal('delete') }

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleCreate = async () => {
    if (!form.fullName || !form.gender || !form.className || !form.section || !form.rollNumber) { setError('Name, Gender, Class, Section, Roll Number are required.'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    const json = await res.json()
    setSaving(false)
    if (json.success) { setCredentials({ username: json.data.generatedUsername, password: json.data.generatedPassword }); fetchStudents(); fetchStats() }
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
    const res = await fetch(`/api/students/${selected.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    setSaving(false)
    if (json.success) { closeModal(); fetchStudents(); fetchStats() }
    else { setError(json.message || 'Failed to delete'); setModal(null) }
  }

  const copyCredentials = () => {
    if (!credentials) return
    navigator.clipboard.writeText(`Username: ${credentials.username}\nPassword: ${credentials.password}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const totalPages = Math.ceil(total / LIMIT)

  const statCards = [
    { label: 'My Students', value: stats?.total ?? '—', icon: Users, color: 'bg-blue-50 text-blue-700' },
    { label: 'Boys', value: stats?.boys ?? '—', icon: GraduationCap, color: 'bg-sky-50 text-sky-700' },
    { label: 'Girls', value: stats?.girls ?? '—', icon: UserCheck, color: 'bg-pink-50 text-pink-700' },
    { label: 'Active', value: stats?.active ?? '—', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">My Students</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} student{total !== 1 ? 's' : ''} assigned to you</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0B2447] text-white text-sm font-semibold rounded-xl hover:bg-[#163d6a] transition-colors shadow-sm">
          <UserPlus size={16} /> Add Student
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statCards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-gov-border shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
              <c.icon size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#0B2447]">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* RBAC Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="mb-5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-2">
        <span className="text-blue-500 text-lg">🔐</span>
        <p className="text-xs text-blue-700 font-medium">
          You can create, edit, and delete students assigned to you. Students you create can log in and view their portal.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
        className="bg-white rounded-2xl shadow-sm border border-gov-border p-4 mb-5 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, roll number…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]" />
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-[#0B2447] text-white border-[#0B2447]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Filter size={15} /> Filter
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Class</label>
              <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20">
                <option value="">All Classes</option>
                {CLASSES.map(c => <option key={c} value={c}>Std {c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Section</label>
              <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20">
                <option value="">All Sections</option>
                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
          </div>
        )}
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B2447] text-white">
                {['#','Adm No','Roll No','Name','Gender','Class','Blood Grp','Mobile','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i} className="border-t border-gray-50">
                  {[...Array(10)].map((__, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <UserPlus size={36} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400 font-medium">No students yet</p>
                    <p className="text-gray-300 text-xs mt-1">Click "Add Student" to create your first student</p>
                  </td>
                </tr>
              ) : students.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * LIMIT + i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.admissionNumber || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{s.rollNumber}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {s.fullName[0]}
                      </div>
                      <span className="font-semibold text-gray-800 whitespace-nowrap">{s.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {s.gender === 'MALE' ? 'Boy' : 'Girl'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">Std {s.className}-{s.section}</td>
                  <td className="px-4 py-3">
                    {s.bloodGroup ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">{s.bloodGroup}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{s.mobile || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openView(s)} title="View" className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"><Eye size={14} /></button>
                      <button onClick={() => openEdit(s)} title="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-[#0B2447] hover:bg-blue-50 transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => openDelete(s)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT, total)} of {total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40"><ChevronLeft size={16} /></button>
              {[...Array(Math.min(totalPages,5))].map((_,i) => (
                <button key={i} onClick={() => setPage(i+1)} className={`w-7 h-7 rounded-lg text-xs font-medium ${page===i+1 ? 'bg-[#0B2447] text-white' : 'hover:bg-gray-200 text-gray-600'}`}>{i+1}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <AnimatePresence>

        {/* View Modal */}
        {modal === 'view' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="bg-[#0B2447] rounded-t-2xl p-6 flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold shrink-0 ${selected.gender === 'MALE' ? 'bg-blue-400/30 text-blue-100' : 'bg-pink-400/30 text-pink-100'}`}>
                  {selected.fullName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-bold text-xl truncate">{selected.fullName}</h2>
                  <p className="text-[#D4AF37] text-sm font-semibold">{selected.admissionNumber || '—'}</p>
                  <p className="text-white/60 text-xs mt-0.5">Std {selected.className}-{selected.section} · Roll {selected.rollNumber}</p>
                </div>
                <button onClick={closeModal} className="text-white/60 hover:text-white shrink-0"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{selected.status}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{selected.gender === 'MALE' ? 'Male' : 'Female'}</span>
                  {selected.bloodGroup && <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">{selected.bloodGroup}</span>}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0B2447] uppercase tracking-wider mb-3">Academic Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Class & Section', value: `Std ${selected.className} – ${selected.section}` },
                      { label: 'Roll Number', value: selected.rollNumber },
                      { label: 'Date of Birth', value: selected.dateOfBirth || '—' },
                      { label: 'Username', value: selected.username || '—' },
                    ].map(f => (
                      <div key={f.label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400">{f.label}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0B2447] uppercase tracking-wider mb-3">Parent & Contact</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Father', value: selected.fatherName || '—' },
                      { label: 'Mother', value: selected.motherName || '—' },
                      { label: 'Mobile', value: selected.mobile || '—' },
                      { label: 'Address', value: selected.address || '—' },
                    ].map(f => (
                      <div key={f.label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400">{f.label}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5 break-words">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Close</button>
                  <button onClick={() => { closeModal(); openEdit(selected) }} className="flex-1 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a]">Edit Student</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Create / Edit Modal */}
        {(modal === 'create' || modal === 'edit') && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-5 bg-[#0B2447] sticky top-0 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <Plus size={18} className="text-[#D4AF37]" />
                    <h2 className="text-white font-bold text-base">{modal === 'create' ? 'Add New Student' : 'Edit Student'}</h2>
                  </div>
                  <button onClick={closeModal} className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"><X size={18} /></button>
                </div>

                {credentials ? (
                  <div className="p-6">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={18} className="text-emerald-600" />
                        <p className="text-emerald-700 font-bold text-sm">Student Created!</p>
                      </div>
                      <p className="text-xs text-emerald-600 mb-3">Save these login credentials before closing:</p>
                      <div className="bg-white border border-emerald-200 rounded-lg p-3 font-mono text-sm space-y-1">
                        <p><span className="text-gray-500 text-xs">Username:</span> <span className="font-bold text-gray-800">{credentials.username}</span></p>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">Password:</span>
                          <span className="font-bold text-gray-800">{showPass ? credentials.password : '••••••••'}</span>
                          <button onClick={() => setShowPass(p => !p)} className="text-gray-400 hover:text-gray-600">{showPass ? <EyeOff size={13}/> : <Eye size={13}/>}</button>
                        </div>
                      </div>
                      <button onClick={copyCredentials} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                        {copied ? <><CheckCircle size={12}/> Copied!</> : <><Copy size={12}/> Copy credentials</>}
                      </button>
                    </div>
                    <button onClick={closeModal} className="w-full py-2.5 bg-[#0B2447] text-white rounded-xl font-semibold text-sm">Done</button>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                        <input type="text" value={form.fullName} onChange={set('fullName')} placeholder="e.g. Arjun Kumar" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Gender <span className="text-red-500">*</span></label>
                        <select value={form.gender} onChange={set('gender')} className={inp}>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Date of Birth</label>
                        <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Blood Group</label>
                        <select value={form.bloodGroup} onChange={set('bloodGroup')} className={inp}>
                          <option value="">Select</option>
                          {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Class <span className="text-red-500">*</span></label>
                        <select value={form.className} onChange={set('className')} className={inp}>
                          {CLASSES.map(c => <option key={c} value={c}>Std {c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Section <span className="text-red-500">*</span></label>
                        <select value={form.section} onChange={set('section')} className={inp}>
                          {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Roll Number <span className="text-red-500">*</span></label>
                        <input type="text" value={form.rollNumber} onChange={set('rollNumber')} placeholder="e.g. S016" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Father's Name</label>
                        <input type="text" value={form.fatherName} onChange={set('fatherName')} placeholder="e.g. Kumar Raj" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Mother's Name</label>
                        <input type="text" value={form.motherName} onChange={set('motherName')} placeholder="e.g. Priya Kumar" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Mobile</label>
                        <input type="tel" value={form.mobile} onChange={set('mobile')} placeholder="10-digit number" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Status</label>
                        <select value={form.status} onChange={set('status')} className={inp}>
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Address</label>
                        <input type="text" value={form.address} onChange={set('address')} placeholder="Full address" className={inp} />
                      </div>
                    </div>
                    {error && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                        <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
                      </div>
                    )}
                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                      <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
                      <button onClick={modal === 'create' ? handleCreate : handleEdit} disabled={saving}
                        className="px-5 py-2 bg-[#0B2447] text-white text-sm font-semibold rounded-xl hover:bg-[#163d6a] transition-colors disabled:opacity-60">
                        {saving ? 'Saving…' : modal === 'create' ? 'Create Student' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}

        {/* Delete Modal */}
        {modal === 'delete' && selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={22} className="text-red-600" />
                </div>
                <h3 className="font-bold text-gray-800 text-base mb-1">Delete Student?</h3>
                <p className="text-sm text-gray-500 mb-1"><span className="font-semibold text-gray-700">{selected.fullName}</span></p>
                <p className="text-xs text-gray-400 mb-5">This will permanently delete all their records including attendance, marks, and leave requests.</p>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50">Cancel</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60">
                    {saving ? 'Deleting…' : 'Delete'}
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
