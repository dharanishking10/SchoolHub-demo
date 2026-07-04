import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle, XCircle, Clock, X, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface LeaveReq { id: number; fromDate: string; toDate: string; reason: string; status: string; teacherComment?: string; createdAt: string }
const STATUS_MAP: Record<string, { label: string; icon: typeof CheckCircle; bg: string }> = {
  PENDING: { label: 'Pending', icon: Clock, bg: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Approved', icon: CheckCircle, bg: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Rejected', icon: XCircle, bg: 'bg-red-100 text-red-600' },
}
const EMPTY = { fromDate: '', toDate: '', reason: '' }

export default function SLeave() {
  const { token } = useAuth()
  const [requests, setRequests] = useState<LeaveReq[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'delete' | null>(null)
  const [selected, setSelected] = useState<LeaveReq | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchRequests = useCallback(() => {
    setLoading(true)
    fetch('/api/leave', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setRequests(d.data) }).finally(() => setLoading(false))
  }, [token])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleApply = async () => {
    if (!form.fromDate || !form.toDate || !form.reason) { setError('All fields required'); return }
    if (new Date(form.toDate) < new Date(form.fromDate)) { setError('End date must be after start date'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/leave', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    const json = await res.json(); setSaving(false)
    if (json.success) {
      setModal(null); setForm({ ...EMPTY })
      setSuccess('Leave request submitted successfully!')
      setTimeout(() => setSuccess(''), 3000)
      fetchRequests()
    } else setError(json.message || 'Failed to submit')
  }

  const handleDelete = async () => {
    if (!selected) return; setSaving(true)
    await fetch(`/api/leave/${selected.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setSaving(false); setModal(null); setSelected(null); fetchRequests()
  }

  const pendingCount = requests.filter(r => r.status === 'PENDING').length

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Leave Requests</h1>
          <p className="text-gray-500 text-sm mt-0.5">{pendingCount > 0 ? <span className="text-amber-600">{pendingCount} pending</span> : `${requests.length} total request${requests.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button onClick={() => { setForm({ ...EMPTY }); setError(''); setModal('create') }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] shadow-sm">
          <Plus size={16} className="text-secondary" /> Apply Leave
        </button>
      </motion.div>

      {success && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">
          <CheckCircle size={16} /> {success}
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gov-border text-gray-400">
          <Clock size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No leave requests</p>
          <p className="text-sm mt-1">Click "Apply Leave" to submit a request</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req, i) => {
            const S = STATUS_MAP[req.status] || STATUS_MAP.PENDING
            const Icon = S.icon
            return (
              <motion.div key={req.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-gov-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${S.bg}`}>
                        <Icon size={11} />{S.label}
                      </span>
                      <span className="text-xs text-gray-400">{req.fromDate} → {req.toDate}</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">{req.reason}</p>
                    {req.teacherComment && (
                      <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 px-3 py-1.5 rounded-lg italic">
                        Teacher: {req.teacherComment}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">Applied: {new Date(req.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  {req.status === 'PENDING' && (
                    <button onClick={() => { setSelected(req); setModal('delete') }} className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors shrink-0"><Trash2 size={15} /></button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {modal === 'create' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 bg-[#0B2447] rounded-t-2xl">
                <h2 className="text-white font-bold text-lg">Apply for Leave</h2>
                <button onClick={() => setModal(null)} className="text-white/70 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">From Date<span className="text-red-500 ml-0.5">*</span></label>
                    <input type="date" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">To Date<span className="text-red-500 ml-0.5">*</span></label>
                    <input type="date" value={form.toDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Reason<span className="text-red-500 ml-0.5">*</span></label>
                  <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} placeholder="Briefly explain the reason for leave…"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none focus:ring-2 focus:ring-[#0B2447]/30" />
                </div>
                {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex gap-3">
                  <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
                  <button onClick={handleApply} disabled={saving} className="flex-1 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] disabled:opacity-60">
                    {saving ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        {modal === 'delete' && selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={24} className="text-red-500" /></div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">Cancel Leave Request?</h3>
              <p className="text-gray-500 text-sm mb-6">This will cancel your leave request for {selected.fromDate} → {selected.toDate}.</p>
              <div className="flex gap-3">
                <button onClick={() => { setModal(null); setSelected(null) }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Keep</button>
                <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
                  {saving ? 'Cancelling…' : 'Cancel Request'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
