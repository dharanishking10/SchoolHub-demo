import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Users, MapPin, Calendar, User, GraduationCap, Info } from 'lucide-react'
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

export default function SClass() {
  const { token } = useAuth()
  const [cls, setCls] = useState<SchoolClass | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/classes/mine', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) setCls(d.data)
        else setError(d.message || 'Failed to load class information')
      })
      .catch(() => setError('Failed to load class information'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gov-border p-6">
              <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-3" />
              <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm">{error}</div>
      </div>
    )
  }

  if (!cls) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-[#0B2447]">My Class</h1>
        </motion.div>
        <div className="bg-white rounded-2xl border border-gov-border shadow-sm p-12 text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">Class information not available</p>
          <p className="text-gray-400 text-sm mt-1">Your class has not been set up yet. Please contact your school administrator.</p>
        </div>
      </div>
    )
  }

  const availableSeats = Math.max(0, cls.maxStrength - cls.currentStudentCount)
  const fillPct = Math.min(100, (cls.currentStudentCount / cls.maxStrength) * 100)

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">My Class</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your assigned class information</p>
      </motion.div>

      {/* Class Banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-gradient-to-r from-[#0B2447] to-[#1a3a6b] rounded-2xl p-6 mb-5 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-20 h-20 bg-[#D4AF37]/20 border-2 border-[#D4AF37]/40 rounded-2xl flex items-center justify-center shrink-0">
          <span className="text-[#D4AF37] font-extrabold text-3xl">{cls.name}</span>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[#D4AF37] text-xs font-semibold tracking-widest uppercase mb-1">Your Class</p>
          <h2 className="text-white text-2xl font-extrabold">Standard {cls.name} — Section {cls.section}</h2>
          <p className="text-blue-200 text-sm mt-1">{cls.academicYear} Academic Year</p>
        </div>
        <div className="sm:ml-auto">
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${cls.status === 'ACTIVE' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-gray-400/20 text-gray-300'}`}>
            {cls.status}
          </span>
        </div>
      </motion.div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { icon: Users, label: 'Total Students', value: cls.currentStudentCount, color: 'bg-blue-50 text-blue-700' },
          { icon: GraduationCap, label: 'Available Seats', value: availableSeats, color: 'bg-emerald-50 text-emerald-700' },
          { icon: MapPin, label: 'Room Number', value: cls.roomNumber || '—', color: 'bg-amber-50 text-amber-700' },
          { icon: Calendar, label: 'Academic Year', value: cls.academicYear, color: 'bg-violet-50 text-violet-700' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
            className="bg-white rounded-2xl border border-gov-border shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
              <s.icon size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-lg font-bold text-[#0B2447]">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Class Teacher & Capacity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Class Teacher */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-gov-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-[#0B2447]" />
            <h3 className="text-sm font-semibold text-[#0B2447]">Class Teacher</h3>
          </div>
          {cls.classTeacher ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0B2447]/10 flex items-center justify-center shrink-0">
                <span className="text-[#0B2447] font-bold text-lg">{cls.classTeacher.fullName[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800">{cls.classTeacher.fullName}</p>
                <p className="text-sm text-gray-500">{cls.classTeacher.subject}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{cls.classTeacher.employeeId}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <Info size={14} />
              <p className="text-sm">Class teacher not assigned yet</p>
            </div>
          )}
        </motion.div>

        {/* Class Capacity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          className="bg-white rounded-2xl border border-gov-border shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-[#0B2447]" />
            <h3 className="text-sm font-semibold text-[#0B2447]">Class Capacity</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Enrolled</span>
              <span className="font-bold text-gray-800">{cls.currentStudentCount} students</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Maximum Strength</span>
              <span className="font-bold text-gray-800">{cls.maxStrength} seats</span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Occupancy</span>
                <span>{Math.round(fillPct)}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${fillPct >= 100 ? 'bg-red-400' : fillPct >= 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Available Seats</span>
              <span className={`font-bold ${availableSeats === 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {availableSeats} seats
              </span>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  )
}
