import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Clock, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface LeaveReq { id: number; fromDate: string; toDate: string; reason: string; status: string; teacherComment?: string; createdAt: string; student: { id: number; fullName: string; rollNumber: string; className: string; section: string } }
const STATUS_MAP: Record<string, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  PENDING: { label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 text-amber-700' },
  APPROVED: { label: 'Approved', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rejected', icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 text-red-600' },
}

export default function TLeave() {
  const { token } = useAuth()
  const [requests, setRequests] = useState<LeaveReq[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [modal, setModal] = useState<'review' | null>(null)
  const [selected, setSelected] = useState<LeaveReq | null>(null)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchRequests = useCallback(() => {
    setLoading(true)
    const params = filter !== 'ALL' ? `?status=${filter}` : ''
    fetch(`/api/leave${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setRequests(d.data) }).finally(() => setLoading(false))
  }, [token, filter])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const openReview = (req: LeaveReq) => { setSelected(req); setComment(''); setModal('review') }
  const closeModal = () => { setModal(null); setSelected(null) }

  const handleDecision = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selected) return
    setSaving(true)
    await fetch(`/api/leave/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, teacherComment: comment }),
    })
    setSaving(false); closeModal(); fetchRequests()
  }

  const displayed = requests.filter(r => filter === 'ALL' || r.status === filter)
  const pending = requests.filter(r => r.status === 'PENDING').length

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Leave Requests</h1>
          <p className="text-gray-500 text-sm mt-0.5">{pending > 0 ? <span className="text-amber-600 font-semibold">{pending} pending review</span> : 'All requests reviewed'}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {['ALL','PENDING','APPROVED','REJECTED'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filter === s ? 'bg-white text-[#0B2447] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{s}</button>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><Clock size={40} className="mx-auto mb-3 opacity-30" /><p className="font-semibold">No leave requests</p></div>
      ) : (
        <div className="space-y-3">
          {displayed.map((req, i) => {
            const s = STATUS_MAP[req.status] || STATUS_MAP.PENDING
            const Icon = s.icon
            return (
              <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl shadow-sm border border-gov-border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-800">{req.student.fullName}</p>
                    <span className="text-xs text-gray-400">Std {req.student.className}-{req.student.section} · {req.student.rollNumber}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{req.reason}</p>
                  <p className="text-xs text-gray-400">
                    {req.fromDate} → {req.toDate} · Applied {new Date(req.createdAt).toLocaleDateString('en-IN')}
                  </p>
                  {req.teacherComment && <p className="text-xs text-gray-500 mt-1 italic">Comment: {req.teacherComment}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${s.bg}`}>
                    <Icon size={12} />{s.label}
                  </span>
                  {req.status === 'PENDING' && (
                    <button onClick={() => openReview(req)} className="px-4 py-2 bg-[#0B2447] text-white rounded-xl text-xs font-semibold hover:bg-[#163d6a]">Review</button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {modal === 'review' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 bg-[#0B2447] rounded-t-2xl">
                <h2 className="text-white font-bold text-base">Review Leave Request</h2>
                <button onClick={closeModal} className="text-white/70 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6">
                <div className="bg-gov-bg rounded-xl p-4 mb-4">
                  <p className="font-bold text-gray-800">{selected.student.fullName}</p>
                  <p className="text-sm text-gray-600 mt-0.5">Std {selected.student.className}-{selected.student.section}</p>
                  <p className="text-sm text-gray-700 mt-2">{selected.reason}</p>
                  <p className="text-xs text-gray-400 mt-2">{selected.fromDate} → {selected.toDate}</p>
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Comment (optional)</label>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Leave a note for the student…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleDecision('REJECTED')} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
                    <XCircle size={15} /> Reject
                  </button>
                  <button onClick={() => handleDecision('APPROVED')} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60">
                    <CheckCircle size={15} /> Approve
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
