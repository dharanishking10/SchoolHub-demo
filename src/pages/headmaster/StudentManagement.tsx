import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, Edit2, Trash2, X, Eye, EyeOff, Copy, CheckCircle,
  ChevronLeft, ChevronRight, Filter, Download, Users, KeyRound,
  UserCheck, GraduationCap, RefreshCw, UserMinus
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Teacher { id: number; fullName: string; employeeId: string }
interface Student {
  id: number; admissionNumber?: string; fullName: string; gender: string
  dateOfBirth?: string; bloodGroup?: string; photo?: string
  fatherName?: string; motherName?: string; mobile?: string
  address?: string; className: string; section: string; rollNumber: string
  username?: string; status: string; createdAt: string
  createdByTeacher?: { id: number; fullName: string; employeeId: string } | null
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

export default function StudentManagement() {
  const { token } = useAuth()

  // list
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterTeacher, setFilterTeacher] = useState('')
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // stats
  const [stats, setStats] = useState<Stats | null>(null)

  // teachers list for filter
  const [teachers, setTeachers] = useState<Teacher[]>([])

  // modals
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'view' | 'reset' | null>(null)
  const [selected, setSelected] = useState<Student | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [credentials, setCredentials] = useState<{ password: string; username: string } | null>(null)
  const [resetPwd, setResetPwd] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const fetchStats = useCallback(() => {
    fetch('/api/students/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setStats(d.data) })
  }, [token])

  const fetchTeachers = useCallback(() => {
    fetch('/api/teachers?limit=100', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setTeachers(d.data.teachers || []) })
  }, [token])

  const fetchStudents = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ search, page: String(page), limit: String(LIMIT) })
    if (filterClass) params.append('className', filterClass)
    if (filterSection) params.append('section', filterSection)
    if (filterStatus) params.append('status', filterStatus)
    if (filterGender) params.append('gender', filterGender)
    if (filterTeacher) params.append('teacherId', filterTeacher)
    fetch(`/api/students?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) { setStudents(d.data.students); setTotal(d.data.total) } })
      .finally(() => setLoading(false))
  }, [token, search, page, filterClass, filterSection, filterStatus, filterGender, filterTeacher])

  useEffect(() => { setPage(1) }, [search, filterClass, filterSection, filterStatus, filterGender, filterTeacher])
  useEffect(() => { fetchStudents() }, [fetchStudents])
  useEffect(() => { fetchStats(); fetchTeachers() }, [fetchStats, fetchTeachers])

  const closeModal = () => { setModal(null); setSelected(null); setCredentials(null); setResetPwd(''); setError('') }
  const openCreate = () => { setForm({ ...EMPTY_FORM }); setCredentials(null); setError(''); setModal('create') }
  const openView = (s: Student) => { setSelected(s); setModal('view') }
  const openEdit = (s: Student) => {
    setSelected(s)
    setForm({ fullName: s.fullName, gender: s.gender, dateOfBirth: s.dateOfBirth || '', bloodGroup: s.bloodGroup || '', fatherName: s.fatherName || '', motherName: s.motherName || '', mobile: s.mobile || '', address: s.address || '', className: s.className, section: s.section, rollNumber: s.rollNumber, status: s.status })
    setError(''); setModal('edit')
  }
  const openDelete = (s: Student) => { setSelected(s); setModal('delete') }
  const openReset = (s: Student) => { setSelected(s); setResetPwd(''); setModal('reset') }

  const set = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleCreate = async () => {
    if (!form.fullName || !form.gender || !form.className || !form.section || !form.rollNumber) { setError('Name, Gender, Class, Section, Roll Number are required.'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    const json = await res.json()
    setSaving(false)
    if (json.success) { setCredentials({ password: json.data.generatedPassword, username: json.data.generatedUsername }); fetchStudents(); fetchStats() }
    else setError(json.message || 'Failed to create student')
  }

  const handleEdit = async () => {
    if (!selected) return
    setSaving(true); setError('')
    const res = await fetch(`/api/students/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    const json = await res.json()
    setSaving(false)
    if (json.success) { closeModal(); fetchStudents(); fetchStats() }
    else setError(json.message || 'Failed to update')
  }

  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    await fetch(`/api/students/${selected.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setSaving(false); closeModal(); fetchStudents(); fetchStats()
  }

  const handleResetPassword = async () => {
    if (!selected) return
    setSaving(true)
    const res = await fetch(`/api/students/${selected.id}/reset-password`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    setSaving(false)
    if (json.success) setResetPwd(json.data.newPassword)
    else setError(json.message || 'Failed to reset password')
  }

  const exportCSV = () => {
    const headers = ['Adm No','Full Name','Gender','DOB','Blood Group','Father','Mother','Mobile','Class','Section','Roll No','Teacher','Status']
    const rows = students.map(s => [s.admissionNumber||'',s.fullName,s.gender,s.dateOfBirth||'',s.bloodGroup||'',s.fatherName||'',s.motherName||'',s.mobile||'',s.className,s.section,s.rollNumber,s.createdByTeacher?.fullName||'',s.status])
    const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=`students_${filterClass||'all'}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  const copyText = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000) }
  const totalPages = Math.ceil(total / LIMIT)

  const statCards = [
    { label: 'Total Students', value: stats?.total ?? '—', icon: Users, color: 'bg-blue-50 text-blue-700' },
    { label: 'Boys', value: stats?.boys ?? '—', icon: GraduationCap, color: 'bg-sky-50 text-sky-700' },
    { label: 'Girls', value: stats?.girls ?? '—', icon: UserCheck, color: 'bg-pink-50 text-pink-700' },
    { label: 'Active Students', value: stats?.active ?? '—', icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
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
            <Plus size={16} className="text-[#D4AF37]" /> Add Student
          </button>
        </div>
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

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-4 mb-5 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, admission no, roll no…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]" />
          </div>
          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-[#0B2447] text-white border-[#0B2447]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Filter size={15} /> Filters
          </button>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 overflow-hidden">
              {[
                { label: 'Class', value: filterClass, set: setFilterClass, opts: [['', 'All Classes'], ...CLASSES.map(c => [c, `Std ${c}`])] },
                { label: 'Section', value: filterSection, set: setFilterSection, opts: [['', 'All Sections'], ...SECTIONS.map(s => [s, `Section ${s}`])] },
                { label: 'Gender', value: filterGender, set: setFilterGender, opts: [['', 'All Genders'], ['MALE', 'Boys'], ['FEMALE', 'Girls']] },
                { label: 'Status', value: filterStatus, set: setFilterStatus, opts: [['', 'All Status'], ['ACTIVE', 'Active'], ['INACTIVE', 'Inactive']] },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                  <select value={f.value} onChange={e => f.set(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]">
                    {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Teacher</label>
                <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]">
                  <option value="">All Teachers</option>
                  {teachers.map(t => <option key={t.id} value={String(t.id)}>{t.fullName}</option>)}
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
                {['#','Adm No','Student Name','Gender','Class','Teacher','Mobile','Status','Actions'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(6)].map((_, i) => (
                <tr key={i} className="border-t border-gray-100">
                  {[...Array(9)].map((_, j) => <td key={j} className="px-3 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              )) : students.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-14 text-gray-400">
                  <Users size={32} className="mx-auto text-gray-200 mb-2" />
                  No students found
                </td></tr>
              ) : students.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-t border-gray-100 hover:bg-gov-bg transition-colors">
                  <td className="px-3 py-3 text-gray-400 text-xs">{(page - 1) * LIMIT + i + 1}</td>
                  <td className="px-3 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{s.admissionNumber || '—'}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {s.fullName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 whitespace-nowrap">{s.fullName}</p>
                        <p className="text-xs text-gray-400">{s.rollNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${s.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {s.gender === 'MALE' ? 'Boy' : 'Girl'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap">Std {s.className}-{s.section}</td>
                  <td className="px-3 py-3 text-gray-600 whitespace-nowrap text-xs">{s.createdByTeacher?.fullName || '—'}</td>
                  <td className="px-3 py-3 text-gray-600">{s.mobile || '—'}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openView(s)} title="View" className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"><Eye size={13} /></button>
                      <button onClick={() => openEdit(s)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Edit2 size={13} /></button>
                      <button onClick={() => openReset(s)} title="Reset Password" className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"><KeyRound size={13} /></button>
                      <button onClick={() => openDelete(s)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={13} /></button>
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
              {[...Array(Math.min(totalPages,5))].map((_,i) => {
                const pg = totalPages<=5 ? i+1 : page<=3 ? i+1 : page+i-2
                if (pg>totalPages) return null
                return <button key={pg} onClick={()=>setPage(pg)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page===pg ? 'bg-[#0B2447] text-white' : 'hover:bg-gray-200 text-gray-600'}`}>{pg}</button>
              })}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>

        {/* View Profile Modal */}
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
                {/* Status + Gender */}
                <div className="flex gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{selected.status}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${selected.gender === 'MALE' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>{selected.gender === 'MALE' ? 'Male' : 'Female'}</span>
                  {selected.bloodGroup && <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">{selected.bloodGroup}</span>}
                </div>

                {/* Academic */}
                <div>
                  <p className="text-xs font-bold text-[#0B2447] uppercase tracking-wider mb-3">Academic Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Class', value: `Std ${selected.className} – ${selected.section}` },
                      { label: 'Roll Number', value: selected.rollNumber },
                      { label: 'Username', value: selected.username || '—' },
                      { label: 'Date of Birth', value: selected.dateOfBirth || '—' },
                    ].map(f => (
                      <div key={f.label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400">{f.label}</p>
                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parent */}
                <div>
                  <p className="text-xs font-bold text-[#0B2447] uppercase tracking-wider mb-3">Parent & Contact</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Father Name', value: selected.fatherName || '—' },
                      { label: 'Mother Name', value: selected.motherName || '—' },
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

                {/* Teacher */}
                {selected.createdByTeacher && (
                  <div className="bg-[#0B2447]/5 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0B2447] flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">{selected.createdByTeacher.fullName[0]}</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Assigned Teacher</p>
                      <p className="text-sm font-bold text-[#0B2447]">{selected.createdByTeacher.fullName}</p>
                      <p className="text-xs text-gray-400">{selected.createdByTeacher.employeeId}</p>
                    </div>
                  </div>
                )}

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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
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
                    {[{ label: 'Username', val: credentials.username }, { label: 'Password', val: credentials.password }].map(({ label, val }) => (
                      <div key={label}>
                        <p className="text-xs font-semibold text-amber-700 mb-1">{label}</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-white border border-amber-200 px-3 py-2 rounded-lg text-sm font-mono text-gray-800">
                            {label === 'Password' && !showPass ? '•'.repeat(val.length) : val}
                          </code>
                          {label === 'Password' && <button onClick={() => setShowPass(p => !p)} className="p-2 rounded-lg hover:bg-amber-100 text-amber-700">{showPass ? <EyeOff size={14}/> : <Eye size={14}/>}</button>}
                          <button onClick={() => copyText(val)} className="p-2 rounded-lg hover:bg-amber-100 text-amber-700">
                            {copied ? <CheckCircle size={14} className="text-emerald-600"/> : <Copy size={14}/>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={closeModal} className="w-full py-2.5 bg-[#0B2447] text-white rounded-xl font-semibold text-sm hover:bg-[#163d6a]">Done</button>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Basic */}
                  <div>
                    <p className="text-xs font-bold text-[#0B2447] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#0B2447] text-white rounded-full flex items-center justify-center text-[10px]">1</span> Basic Information
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                        <input value={form.fullName} onChange={set('fullName')} placeholder="e.g. Arjun Kumar" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Gender <span className="text-red-500">*</span></label>
                        <select value={form.gender} onChange={set('gender')} className={inp}>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth</label>
                        <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Blood Group</label>
                        <select value={form.bloodGroup} onChange={set('bloodGroup')} className={inp}>
                          <option value="">Select</option>
                          {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Parent */}
                  <div>
                    <p className="text-xs font-bold text-[#0B2447] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#0B2447] text-white rounded-full flex items-center justify-center text-[10px]">2</span> Parent Information
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Father Name</label>
                        <input value={form.fatherName} onChange={set('fatherName')} placeholder="Father's full name" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Mother Name</label>
                        <input value={form.motherName} onChange={set('motherName')} placeholder="Mother's full name" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Guardian Mobile</label>
                        <input type="tel" value={form.mobile} onChange={set('mobile')} placeholder="10-digit number" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                        <input value={form.address} onChange={set('address')} placeholder="Full address" className={inp} />
                      </div>
                    </div>
                  </div>

                  {/* Academic */}
                  <div>
                    <p className="text-xs font-bold text-[#0B2447] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#0B2447] text-white rounded-full flex items-center justify-center text-[10px]">3</span> Academic Details
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Class <span className="text-red-500">*</span></label>
                        <select value={form.className} onChange={set('className')} className={inp}>
                          {CLASSES.map(c => <option key={c} value={c}>Std {c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Section <span className="text-red-500">*</span></label>
                        <select value={form.section} onChange={set('section')} className={inp}>
                          {SECTIONS.map(s => <option key={s} value={s}>Sec {s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Roll Number <span className="text-red-500">*</span></label>
                        <input value={form.rollNumber} onChange={set('rollNumber')} placeholder="e.g. S016" className={inp} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                        <select value={form.status} onChange={set('status')} className={inp}>
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {modal === 'create' && <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">🔐 Username and password will be auto-generated after admission.</p>}
                  {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

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

        {/* Reset Password Modal */}
        {modal === 'reset' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center"><KeyRound size={20} className="text-amber-600" /></div>
                  <div>
                    <h3 className="font-bold text-gray-800">Reset Password</h3>
                    <p className="text-xs text-gray-400">{selected.fullName}</p>
                  </div>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>

              {resetPwd ? (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
                    <div className="flex items-center gap-2 mb-2"><CheckCircle size={16} className="text-emerald-600" /><p className="text-emerald-700 font-semibold text-sm">Password Reset!</p></div>
                    <p className="text-xs text-gray-500 mb-2">New password for {selected.fullName}:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white border border-emerald-200 px-3 py-2 rounded-lg font-mono text-sm text-gray-800">
                        {showPass ? resetPwd : '•'.repeat(resetPwd.length)}
                      </code>
                      <button onClick={() => setShowPass(p => !p)} className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600">{showPass ? <EyeOff size={14}/> : <Eye size={14}/>}</button>
                      <button onClick={() => copyText(resetPwd)} className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600">
                        {copied ? <CheckCircle size={14}/> : <Copy size={14}/>}
                      </button>
                    </div>
                  </div>
                  <button onClick={closeModal} className="w-full py-2.5 bg-[#0B2447] text-white rounded-xl font-semibold text-sm">Done</button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-5">This will generate a new default password based on the student's name and date of birth. Share it with the student securely.</p>
                  {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}
                  <div className="flex gap-3">
                    <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleResetPassword} disabled={saving}
                      className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-60 flex items-center justify-center gap-2">
                      <RefreshCw size={14} className={saving ? 'animate-spin' : ''} />
                      {saving ? 'Resetting…' : 'Reset Password'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Delete Modal */}
        {modal === 'delete' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><UserMinus size={24} className="text-red-500" /></div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Remove Student?</h3>
              <p className="text-gray-500 text-sm mb-1">This will permanently remove</p>
              <p className="font-bold text-gray-800 mb-1">{selected.fullName}</p>
              <p className="text-gray-400 text-xs mb-6">({selected.admissionNumber}) and all their attendance, marks, and leave records.</p>
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
