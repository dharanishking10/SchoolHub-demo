import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Hash } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface SchoolClass { id: number; name: string; section: string }

export default function ClassManagement() {
  const { token } = useAuth()
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/classes', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setClasses(d.data.classes) })
      .finally(() => setLoading(false))
  }, [token])

  const grouped = classes.reduce<Record<string, SchoolClass[]>>((acc, c) => {
    if (!acc[c.name]) acc[c.name] = []
    acc[c.name].push(c)
    return acc
  }, {})

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">Class Management</h1>
        <p className="text-gray-500 text-sm mt-0.5">{classes.length} classes configured for this academic year</p>
      </motion.div>

      <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Classes', value: classes.length, icon: BookOpen },
          { label: 'Standards (VI–XII)', value: Object.keys(grouped).length, icon: Hash },
          { label: 'Sections', value: classes.length, icon: BookOpen },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-gov-border shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center"><c.icon size={20} /></div>
            <div><p className="text-xs text-gray-400">{c.label}</p><p className="text-2xl font-bold text-[#0B2447]">{c.value}</p></div>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-gov-border animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(grouped).map(([std, sections], gi) => (
            sections.map((cls, si) => (
              <motion.div key={cls.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (gi * sections.length + si) * 0.05 }}
                className="bg-white rounded-2xl border border-gov-border shadow-sm p-5 hover:border-[#0B2447]/30 hover:shadow-md transition-all cursor-default">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Standard</p>
                    <p className="text-3xl font-extrabold text-[#0B2447] leading-tight">{cls.name}</p>
                    <p className="text-xs text-gray-500">Section <span className="font-bold text-secondary">{cls.section}</span></p>
                  </div>
                  <div className="w-9 h-9 bg-secondary/20 rounded-xl flex items-center justify-center">
                    <BookOpen size={16} className="text-secondary" />
                  </div>
                </div>
              </motion.div>
            ))
          ))}
        </div>
      )}
    </div>
  )
}
