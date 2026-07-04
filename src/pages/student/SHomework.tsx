import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Clock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface HW { id: number; className: string; section: string; subject: string; title: string; description?: string; dueDate: string; status: string; teacher: { fullName: string; subject: string } }

export default function SHomework() {
  const { token } = useAuth()
  const [homework, setHomework] = useState<HW[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ACTIVE')

  useEffect(() => {
    const params = filter !== 'ALL' ? `?status=${filter}` : ''
    fetch(`/api/homework${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setHomework(d.data) }).finally(() => setLoading(false))
  }, [token, filter])

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Homework</h1>
          <p className="text-gray-500 text-sm mt-0.5">{homework.length} assignment{homework.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {['ACTIVE','CLOSED','ALL'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === s ? 'bg-white text-[#0B2447] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl border animate-pulse" />)}</div>
      ) : homework.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gov-border text-gray-400">
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No homework assigned</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {homework.map((hw, i) => {
            const overdue = hw.status === 'ACTIVE' && isOverdue(hw.dueDate)
            return (
              <motion.div key={hw.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-2xl shadow-sm border p-5 hover:shadow-md transition-shadow ${overdue ? 'border-red-200' : 'border-gov-border'}`}>
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${hw.status === 'ACTIVE' ? (overdue ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700') : 'bg-gray-100 text-gray-500'}`}>
                    {overdue ? 'Overdue' : hw.status}
                  </span>
                  <span className="text-xs font-bold text-[#0B2447]">{hw.subject}</span>
                </div>
                <h3 className="font-bold text-gray-800 text-sm leading-snug mb-1">{hw.title}</h3>
                {hw.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{hw.description}</p>}
                <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-2 mt-2">
                  <Clock size={11} />
                  <span className={overdue ? 'text-red-500 font-semibold' : ''}>Due: {hw.dueDate}</span>
                  <span className="ml-auto">By: {hw.teacher.fullName.split(' ')[0]}</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
