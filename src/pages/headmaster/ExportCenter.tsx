import { motion } from 'framer-motion'
import { Users, GraduationCap, ClipboardCheck, BookOpen, FileText, BarChart2, Download } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const EXPORTS = [
  { key: 'teachers', label: 'Teachers List', desc: 'All teacher records with contact and status', icon: Users, color: 'bg-blue-50 text-blue-600' },
  { key: 'students', label: 'Students List', desc: 'All student admission and class records', icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'attendance', label: 'Attendance Records', desc: 'Full attendance history across all classes', icon: ClipboardCheck, color: 'bg-purple-50 text-purple-600' },
  { key: 'marks', label: 'Marks & Grades', desc: 'Student exam marks and grades', icon: BookOpen, color: 'bg-amber-50 text-amber-600' },
  { key: 'homework', label: 'Homework Log', desc: 'Homework assigned across classes', icon: FileText, color: 'bg-rose-50 text-rose-600' },
  { key: 'reports', label: 'School Summary Report', desc: 'Class-wise student count overview', icon: BarChart2, color: 'bg-[#0B2447]/10 text-[#0B2447]' },
]

export default function ExportCenter() {
  const { token } = useAuth()

  const download = (key: string, label: string) => {
    fetch(`/api/export/${key}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob()).then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `${label.toLowerCase().replace(/\s+/g, '-')}.csv`
        a.click(); URL.revokeObjectURL(url)
      })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">Export Center</h1>
        <p className="text-gray-500 text-sm mt-0.5">Download school records as CSV files for offline use or reporting</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {EXPORTS.map((e, i) => (
          <motion.div key={e.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-gov-border shadow-sm p-5 flex flex-col">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${e.color}`}>
              <e.icon size={20} />
            </div>
            <h3 className="font-bold text-gray-800">{e.label}</h3>
            <p className="text-xs text-gray-500 mt-1 flex-1">{e.desc}</p>
            <button onClick={() => download(e.key, e.label)}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B2447] text-white hover:bg-[#163d6a] transition-colors">
              <Download size={15} /> Download CSV
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
