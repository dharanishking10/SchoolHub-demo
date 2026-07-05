import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Users, Search, Eye, X, GraduationCap, MapPin, Calendar, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface ClassTeacher { id: number; fullName: string; subject: string; employeeId: string }
interface SchoolClass {
  id: number
  name: string
  section: string
  academicYear: string
  classTeacher: ClassTeacher | null
  roomNumber: string
  maxStrength: number
  currentStudentCount: number
  status: string
}

export default function TClasses() {
  const { token } = useAuth()
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewed, setViewed] = useState<SchoolClass | null>(null)

  const fetchClasses = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ search, limit: '50' })
    fetch(`/api/classes?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setClasses(d.data.classes)
          setTotal(d.data.total)
        }
      })
      .finally(() => setLoading(false))
  }, [token, search])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  const activeCount = classes.filter(c => c.status === 'ACTIVE').length
  const totalStudents = classes.reduce((s, c) => s + c.currentStudentCount, 0)

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">My Classes</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {loading ? 'Loading…' : `${total} class${total !== 1 ? 'es' : ''} assigned to you`}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Assigned Classes', value: total, icon: BookOpen, color: 'bg-blue-50 text-blue-700' },
          { label: 'Active Classes', value: loading ? '—' : activeCount, icon: GraduationCap, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Total Students', value: loading ? '—' : totalStudents, icon: Users, color: 'bg-violet-50 text-violet-700' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-gov-border shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-[#0B2447]">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-4 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by class or section…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:border-[#0B2447]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0B2447] text-white">
                {['#', 'Class', 'Section', 'Academic Year', 'Room', 'Students', 'Max Strength', 'Status', 'View'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
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
                    <p className="font-medium">No classes assigned to you yet</p>
                    <p className="text-xs mt-1">Contact the Headmaster to assign you as a class teacher</p>
                  </td>
                </tr>
              ) : (
                classes.map((cls, i) => (
                  <motion.tr key={cls.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-t border-gray-100 hover:bg-gov-bg transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#0B2447]/10 text-[#0B2447] font-extrabold text-sm">
                        {cls.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-[#D4AF37] text-base">{cls.section}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{cls.academicYear}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{cls.roomNumber || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cls.currentStudentCount >= cls.maxStrength ? 'bg-red-400' : 'bg-emerald-400'}`}
                            style={{ width: `${Math.min(100, (cls.currentStudentCount / cls.maxStrength) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{cls.currentStudentCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{cls.maxStrength}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                        {cls.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setViewed(cls)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="View details">
                        <Eye size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {viewed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-[#0B2447] rounded-t-2xl">
                <h2 className="text-white font-bold text-lg">Class Details</h2>
                <button onClick={() => setViewed(null)} className="text-white/70 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#0B2447]/10 flex items-center justify-center">
                    <span className="text-[#0B2447] font-extrabold text-2xl">{viewed.name}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#0B2447]">Std {viewed.name} – Section {viewed.section}</h3>
                    <p className="text-gray-500 text-sm">{viewed.academicYear}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Users, label: 'Students', value: `${viewed.currentStudentCount} enrolled` },
                    { icon: GraduationCap, label: 'Available Seats', value: `${Math.max(0, viewed.maxStrength - viewed.currentStudentCount)} remaining` },
                    { icon: MapPin, label: 'Room', value: viewed.roomNumber || 'Not assigned' },
                    { icon: Calendar, label: 'Academic Year', value: viewed.academicYear },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={13} className="text-[#0B2447]/60" />
                        <p className="text-xs text-gray-400">{label}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <User size={13} className="text-[#0B2447]/60" />
                    <p className="text-xs text-gray-400">Class Teacher</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    {viewed.classTeacher ? viewed.classTeacher.fullName : 'Not assigned'}
                  </p>
                  {viewed.classTeacher && (
                    <p className="text-xs text-gray-400 mt-0.5">{viewed.classTeacher.subject} · {viewed.classTeacher.employeeId}</p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Class Capacity</span>
                    <span>{viewed.currentStudentCount} / {viewed.maxStrength}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${viewed.currentStudentCount >= viewed.maxStrength ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(100, (viewed.currentStudentCount / viewed.maxStrength) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button onClick={() => setViewed(null)}
                    className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
