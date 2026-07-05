import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Clock, Users, GraduationCap, School } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Announcement { id: number; title: string; message: string; audience: string; className?: string | null; section?: string | null; createdByName: string; createdAt: string }

const AUD_ICON: Record<string, typeof Users> = { ALL: School, TEACHERS: Users, STUDENTS: GraduationCap, CLASS: GraduationCap }
const AUD_LABEL: Record<string, string> = { ALL: 'School-wide', TEACHERS: 'For Teachers', STUDENTS: 'For Students', CLASS: 'For Your Class' }

export default function SAnnouncements() {
  const { token } = useAuth()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/announcements', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setItems(d.data) }).finally(() => setLoading(false))
  }, [token])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">Announcements</h1>
        <p className="text-gray-500 text-sm mt-0.5">Latest notices from your school</p>
      </motion.div>

      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border animate-pulse" />)
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gov-border p-10 text-center text-gray-400">
            <Megaphone size={32} className="mx-auto mb-2 opacity-40" />
            No announcements yet
          </div>
        ) : items.map((a, i) => {
          const Icon = AUD_ICON[a.audience] || Megaphone
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-gov-border shadow-sm p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#0B2447]/10 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-[#0B2447]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800">{a.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{a.message}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
                  <span className="px-2 py-0.5 rounded-full bg-gov-bg font-semibold text-gray-500">{AUD_LABEL[a.audience]}</span>
                  <span>By {a.createdByName}</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {new Date(a.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
