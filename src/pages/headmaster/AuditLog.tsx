import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { History, Search, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Log { id: number; userId: number; userName: string; userRole: string; action: string; details?: string | null; createdAt: string }

const ROLE_COLOR: Record<string, string> = { HEADMASTER: 'bg-[#0B2447]/10 text-[#0B2447]', TEACHER: 'bg-blue-50 text-blue-600', STUDENT: 'bg-emerald-50 text-emerald-600' }

export default function AuditLog() {
  const { token } = useAuth()
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)
  const limit = 25

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (action) params.set('action', action)
    if (role) params.set('role', role)
    fetch(`/api/audit-log?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) { setLogs(d.data.logs); setTotal(d.data.total) } })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, action, role, token])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">Audit Log</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track all key actions performed across the platform</p>
      </motion.div>

      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={action} onChange={e => { setAction(e.target.value); setPage(1) }} placeholder="Filter by action (e.g. Attendance, Teacher)"
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30" />
          </div>
          <select value={role} onChange={e => { setRole(e.target.value); setPage(1) }} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
            <option value="">All Roles</option>
            <option value="HEADMASTER">Headmaster</option>
            <option value="TEACHER">Teacher</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading audit log…</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <History size={32} className="mx-auto mb-2 opacity-40" />
            No audit records found
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((l, i) => (
              <motion.div key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-gov-bg">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{l.action}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLOR[l.userRole] || 'bg-gray-100 text-gray-500'}`}>{l.userRole}</span>
                  </div>
                  {l.details && <p className="text-xs text-gray-500 mt-0.5">{l.details}</p>}
                  <p className="text-[11px] text-gray-400 mt-1">{l.userName} · {new Date(l.createdAt).toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gov-border text-gray-600 hover:bg-gov-bg disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
          <span className="text-xs text-gray-500 font-medium">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gov-border text-gray-600 hover:bg-gov-bg disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
        </div>
      )}
    </div>
  )
}
