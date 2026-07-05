import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search, Plus, Edit2, Trash2, X, BookOpen, Users,
  ChevronLeft, ChevronRight, Filter, GraduationCap,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

// ── Types ────────────────────────────────────────────────────────────────────

interface ClassTeacher { id: number; fullName: string; subject: string; employeeId: string }
interface SchoolClass {
  id: number
  name: string
  section: string
  academicYear: string
  classTeacherId: number | null
  classTeacher: ClassTeacher | null
  roomNumber: string
  maxStrength: number
  currentStudentCount: number
  status: string
  createdAt: string
}
interface Teacher { id: number; fullName: string; employeeId: string; subject: string }

// ── Constants ────────────────────────────────────────────────────────────────

const CLASS_NAMES = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const SECTIONS = ['A', 'B', 'C', 'D', 'E']
const LIMIT = 10

// ── Zod Schema ───────────────────────────────────────────────────────────────

const classSchema = z.object({
  name: z.enum(['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as const),
  section: z.enum(['A', 'B', 'C', 'D', 'E'] as const),
  academicYear: z
    .string()
    .min(1, 'Academic year is required')
    .regex(/^\d{4}-\d{4}$/, 'Format must be YYYY-YYYY (e.g. 2025-2026)'),
  classTeacherId: z.string().optional(),
  roomNumber: z.string().optional(),
  maxStrength: z.number().min(1, 'Min 1').max(200, 'Max 200'),
  status: z.enum(['ACTIVE', 'INACTIVE'] as const),
})

type ClassFormData = z.infer<typeof classSchema>

// ── Sub-components (module-level) ────────────────────────────────────────────

const FormError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-red-500 text-xs mt-0.5">{msg}</p> : null

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 focus:border-[#0B2447] disabled:bg-gray-50 disabled:text-gray-400'

// ── Main Component ───────────────────────────────────────────────────────────

export default function ClassManagement() {
  const { token } = useAuth()

  // list state
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [academicYears, setAcademicYears] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // modal state
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<SchoolClass | null>(null)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  // teachers for dropdown
  const [teachers, setTeachers] = useState<Teacher[]>([])

  // react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: 'VI',
      section: 'A',
      academicYear: '2025-2026',
      classTeacherId: '',
      roomNumber: '',
      maxStrength: 40,
      status: 'ACTIVE',
    },
  })

  // ── Fetchers ──────────────────────────────────────────────────────────────

  const fetchClasses = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ search, page: String(page), limit: String(LIMIT) })
    if (filterYear) params.append('academicYear', filterYear)
    if (filterStatus) params.append('status', filterStatus)
    fetch(`/api/classes?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setClasses(d.data.classes)
          setTotal(d.data.total)
          setAcademicYears(d.data.academicYears || [])
        }
      })
      .finally(() => setLoading(false))
  }, [token, search, page, filterYear, filterStatus])

  const fetchTeachers = useCallback(() => {
    fetch('/api/teachers?limit=200', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setTeachers(d.data.teachers) })
  }, [token])

  useEffect(() => { setPage(1) }, [search, filterYear, filterStatus])
  useEffect(() => { fetchClasses() }, [fetchClasses])
  useEffect(() => { fetchTeachers() }, [fetchTeachers])

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    reset({
      name: 'VI',
      section: 'A',
      academicYear: academicYears[0] || '2025-2026',
      classTeacherId: '',
      roomNumber: '',
      maxStrength: 40,
      status: 'ACTIVE',
    })
    setServerError('')
    setModal('create')
  }

  const openEdit = (cls: SchoolClass) => {
    setSelected(cls)
    reset({
      name: cls.name as ClassFormData['name'],
      section: cls.section as ClassFormData['section'],
      academicYear: cls.academicYear,
      classTeacherId: cls.classTeacherId ? String(cls.classTeacherId) : '',
      roomNumber: cls.roomNumber || '',
      maxStrength: cls.maxStrength,
      status: cls.status as 'ACTIVE' | 'INACTIVE',
    })
    setServerError('')
    setModal('edit')
  }

  const openDelete = (cls: SchoolClass) => { setSelected(cls); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null); setServerError('') }

  // ── Submit ────────────────────────────────────────────────────────────────

  const onSubmit = async (data: ClassFormData) => {
    setSaving(true)
    setServerError('')
    const payload = {
      ...data,
      classTeacherId: data.classTeacherId ? parseInt(data.classTeacherId) : null,
      maxStrength: Number(data.maxStrength),
    }
    const url = modal === 'edit' ? `/api/classes/${selected!.id}` : '/api/classes'
    const method = modal === 'edit' ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setSaving(false)
    if (json.success) { closeModal(); fetchClasses() }
    else setServerError(json.message || 'Failed to save class')
  }

  const handleDelete = async () => {
    if (!selected) return
    setSaving(true)
    await fetch(`/api/classes/${selected.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setSaving(false)
    closeModal()
    fetchClasses()
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / LIMIT)
  const activeCount = classes.filter(c => c.status === 'ACTIVE').length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Class Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} class{total !== 1 ? 'es' : ''} configured</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] transition-colors shadow-sm"
        >
          <Plus size={16} className="text-secondary" /> Add Class
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total Classes', value: total, icon: BookOpen, color: 'bg-blue-50 text-blue-700' },
          { label: 'Active Classes', value: loading ? '—' : activeCount, icon: GraduationCap, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Academic Years', value: loading ? '—' : academicYears.length, icon: Users, color: 'bg-violet-50 text-violet-700' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-gov-border shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
              <c.icon size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{c.label}</p>
              <p className="text-xl font-bold text-[#0B2447]">{c.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-4 mb-5 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by class, section, or academic year…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-[#0B2447] text-white border-[#0B2447]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Filter size={15} /> Filters
          </button>
        </div>
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Academic Year</label>
                <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20">
                  <option value="">All Years</option>
                  {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20">
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
                {['#', 'Class', 'Section', 'Academic Year', 'Class Teacher', 'Room', 'Strength', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : classes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-gray-400">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                    <p>No classes found</p>
                  </td>
                </tr>
              ) : (
                classes.map((cls, i) => (
                  <motion.tr key={cls.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-t border-gray-100 hover:bg-gov-bg transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{(page - 1) * LIMIT + i + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#0B2447]/10 text-[#0B2447] font-extrabold text-sm">
                        {cls.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-secondary text-base">{cls.section}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{cls.academicYear}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {cls.classTeacher
                        ? <span title={`${cls.classTeacher.subject} · ${cls.classTeacher.employeeId}`}>{cls.classTeacher.fullName}</span>
                        : <span className="text-gray-300 italic text-xs">Not assigned</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {cls.roomNumber || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full w-16 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cls.currentStudentCount >= cls.maxStrength ? 'bg-red-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(100, (cls.currentStudentCount / cls.maxStrength) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {cls.currentStudentCount}/{cls.maxStrength}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {cls.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(cls)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => openDelete(cls)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40"><ChevronLeft size={16} /></button>
              {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                const p = i + 1
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium ${page === p ? 'bg-[#0B2447] text-white' : 'hover:bg-gray-200 text-gray-600'}`}>
                    {p}
                  </button>
                )
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-200 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>

        {/* Create / Edit modal */}
        {(modal === 'create' || modal === 'edit') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 bg-[#0B2447] rounded-t-2xl">
                <h2 className="text-white font-bold text-lg">
                  {modal === 'create' ? 'Add New Class' : 'Edit Class'}
                </h2>
                <button onClick={closeModal} className="text-white/70 hover:text-white"><X size={20} /></button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

                {/* Class + Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Class Name<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <select {...register('name')} className={inputCls}>
                      {CLASS_NAMES.map(n => <option key={n} value={n}>Std {n}</option>)}
                    </select>
                    <FormError msg={errors.name?.message} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Section<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <select {...register('section')} className={inputCls}>
                      {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                    <FormError msg={errors.section?.message} />
                  </div>
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Academic Year<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input {...register('academicYear')} placeholder="e.g. 2025-2026" className={inputCls} />
                  <FormError msg={errors.academicYear?.message} />
                </div>

                {/* Class Teacher */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Class Teacher</label>
                  <select {...register('classTeacherId')} className={inputCls}>
                    <option value="">— Not assigned —</option>
                    {teachers.map(t => (
                      <option key={t.id} value={String(t.id)}>
                        {t.fullName} ({t.subject})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room + Max Strength */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Room Number</label>
                    <input {...register('roomNumber')} placeholder="e.g. Room 12" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Max Strength<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <input type="number" {...register('maxStrength', { valueAsNumber: true })} min={1} max={200} className={inputCls} />
                    <FormError msg={errors.maxStrength?.message} />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select {...register('status')} className={inputCls}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {serverError && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{serverError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] disabled:opacity-60">
                    {saving ? 'Saving…' : modal === 'create' ? 'Create Class' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Delete confirmation */}
        {modal === 'delete' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Delete Class?</h3>
              <p className="text-gray-500 text-sm mb-2">
                This will permanently remove{' '}
                <span className="font-semibold text-gray-700">Std {selected.name}-{selected.section}</span>{' '}
                ({selected.academicYear}).
              </p>
              {selected.currentStudentCount > 0 && (
                <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg mb-4">
                  ⚠️ This class has {selected.currentStudentCount} active student{selected.currentStudentCount !== 1 ? 's' : ''}. Their class assignment will remain unchanged.
                </p>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={closeModal}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                  Cancel
                </button>
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
