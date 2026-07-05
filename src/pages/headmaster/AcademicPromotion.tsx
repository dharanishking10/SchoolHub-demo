import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, ArrowRight, GraduationCap, Users, AlertTriangle,
  CheckCircle, ChevronRight, RefreshCw, X,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface ClassPreview {
  className: string
  studentCount: number
  action: string
  nextClass: string | null
}

interface PreviewData {
  currentYear: string
  nextYear: string
  classes: ClassPreview[]
  totalActive: number
  promoting: number
  graduating: number
  canPromote: boolean
}

interface PromotionResult {
  previousYear: string
  currentYear: string
  promoted: number
  graduated: number
}

type PageState = 'preview' | 'confirming' | 'done'

export default function AcademicPromotion() {
  const { token } = useAuth()
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [pageState, setPageState] = useState<PageState>('preview')
  const [result, setResult] = useState<PromotionResult | null>(null)
  const [promoting, setPromoting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')

  const fetchPreview = useCallback(() => {
    setLoading(true)
    setFetchError('')
    fetch('/api/school/promotion/preview', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) setPreview(d.data)
        else setFetchError(d.message || 'Failed to load promotion preview')
      })
      .catch(() => setFetchError('Network error — could not load promotion data. Please try again.'))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => { fetchPreview() }, [fetchPreview])

  const handlePromote = async () => {
    setPromoting(true); setError('')
    try {
      const res = await fetch('/api/school/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) { setResult(json.data); setPageState('done') }
      else setError(json.message || 'Promotion failed')
    } catch { setError('Network error. Please try again.') }
    finally { setPromoting(false) }
  }

  const canConfirm = confirmText.trim().toUpperCase() === 'PROMOTE'
  const hasStudents = (preview?.totalActive ?? 0) > 0
  const yearOk = preview?.canPromote ?? false

  // ── Done state ───────────────────────────────────────────────────────────
  if (pageState === 'done' && result) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[70vh]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', bounce: 0.3 }}
          className="bg-white rounded-3xl shadow-xl border border-gov-border p-10 max-w-lg w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
            className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-[#0B2447] mb-1">Promotion Complete!</h2>
          <p className="text-gray-500 mb-8">Academic year has been advanced successfully.</p>

          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="px-4 py-2 bg-gray-100 rounded-xl font-bold text-gray-600">{result.previousYear}</span>
            <ArrowRight size={20} className="text-secondary" />
            <span className="px-4 py-2 bg-[#0B2447] rounded-xl font-bold text-white">{result.currentYear}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 rounded-2xl p-4">
              <p className="text-3xl font-extrabold text-[#0B2447]">{result.promoted}</p>
              <p className="text-sm text-blue-700 font-medium mt-0.5">Students Promoted</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4">
              <p className="text-3xl font-extrabold text-[#0B2447]">{result.graduated}</p>
              <p className="text-sm text-amber-700 font-medium mt-0.5">Students Graduated</p>
            </div>
          </div>

          <p className="text-xs text-gray-400">This action has been recorded in the audit log.</p>
        </motion.div>
      </div>
    )
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="h-8 bg-gray-100 rounded-xl animate-pulse w-64 mb-2" />
        <div className="h-4 bg-gray-100 rounded-xl animate-pulse w-40 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  // ── Fetch error ───────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h2 className="font-bold text-gray-800 text-lg mb-2">Could Not Load Preview</h2>
          <p className="text-gray-500 text-sm mb-5">{fetchError}</p>
          <button onClick={fetchPreview} className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a]">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    )
  }

  // ── Main preview ─────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-[#0B2447] rounded-xl flex items-center justify-center">
            <TrendingUp size={20} className="text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0B2447]">Academic Year Promotion</h1>
            <p className="text-gray-500 text-sm">Advance all students to the next class for the new academic year</p>
          </div>
        </div>
      </motion.div>

      {/* Year card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-[#0B2447] rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Current Year</p>
          <p className="text-3xl font-extrabold text-white">{preview?.currentYear ?? '—'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-0.5 bg-white/20 hidden sm:block" />
          <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
            <ArrowRight size={20} className="text-secondary" />
          </div>
          <div className="w-12 h-0.5 bg-white/20 hidden sm:block" />
        </div>
        <div className="text-center sm:text-right">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Next Year</p>
          <p className="text-3xl font-extrabold text-secondary">{preview?.nextYear ?? '—'}</p>
        </div>
      </motion.div>

      {/* Summary stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Active Students', value: preview?.totalActive ?? 0, color: 'text-[#0B2447]', bg: 'bg-blue-50', icon: <Users size={18} className="text-[#0B2447]" /> },
          { label: 'Will Be Promoted', value: preview?.promoting ?? 0, color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <TrendingUp size={18} className="text-emerald-600" /> },
          { label: 'Will Graduate', value: preview?.graduating ?? 0, color: 'text-amber-700', bg: 'bg-amber-50', icon: <GraduationCap size={18} className="text-amber-600" /> },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 border border-white`}>
            <div className="flex items-center gap-2 mb-2">{s.icon}<p className="text-xs font-semibold text-gray-500">{s.label}</p></div>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Class breakdown */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#0B2447] text-sm">Class-by-Class Breakdown</h2>
          <button onClick={fetchPreview} className="text-gray-400 hover:text-[#0B2447] transition-colors" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {preview?.classes.map((cls, i) => {
            const isGrad = cls.action === 'GRADUATE'
            const isEmpty = cls.studentCount === 0
            return (
              <motion.div key={cls.className} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                className={`flex items-center justify-between px-5 py-3.5 ${isEmpty ? 'opacity-40' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${isGrad ? 'bg-amber-100 text-amber-700' : 'bg-[#0B2447]/8 text-[#0B2447]'}`}>
                    {cls.className}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Std {cls.className}</p>
                    <p className="text-xs text-gray-400">{cls.studentCount} active student{cls.studentCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEmpty ? (
                    <span className="text-xs text-gray-400">No students</span>
                  ) : isGrad ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      <GraduationCap size={12} /> Graduate
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      Std {cls.className} <ChevronRight size={11} /> Std {cls.nextClass}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Warning */}
      {(preview?.graduating ?? 0) > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              {preview?.graduating} Std XII student{(preview?.graduating ?? 0) !== 1 ? 's' : ''} will be marked as <span className="font-extrabold">GRADUATED</span>
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Their records will be preserved but they will no longer appear in active class lists. This cannot be undone.
            </p>
          </div>
        </motion.div>
      )}

      {/* Year format warning */}
      {!yearOk && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Academic Year Format Not Recognised</p>
            <p className="text-xs text-red-600 mt-0.5">
              The current year <span className="font-bold">"{preview?.currentYear}"</span> could not be incremented.
              Please update it to the format <span className="font-bold">YYYY-YYYY</span> (e.g. 2026-2027) in School Profile before promoting.
            </p>
          </div>
        </motion.div>
      )}

      {!hasStudents && yearOk && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 mb-6 text-center text-gray-500 text-sm">
          No active students found. Promotion is not required.
        </div>
      )}

      {/* Promote button */}
      {hasStudents && yearOk && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <button
            onClick={() => { setConfirmText(''); setError(''); setPageState('confirming') }}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#0B2447] text-white rounded-2xl font-bold text-sm hover:bg-[#163d6a] transition-colors shadow-sm">
            <TrendingUp size={18} className="text-secondary" />
            Promote Students
          </button>
        </motion.div>
      )}

      {/* Confirmation modal */}
      <AnimatePresence>
        {pageState === 'confirming' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle size={20} className="text-amber-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">Confirm Promotion</h2>
                </div>
                <button onClick={() => setPageState('preview')} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              {/* Summary in modal */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Academic year</span>
                  <span className="font-bold text-gray-800">{preview?.currentYear} → {preview?.nextYear}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Students promoted</span>
                  <span className="font-bold text-emerald-700">{preview?.promoting}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Students graduated</span>
                  <span className="font-bold text-amber-600">{preview?.graduating}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                This action is <span className="font-bold text-red-600">irreversible</span>. All active student class assignments and the school academic year will be permanently updated.
              </p>

              {/* Confirmation text input */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                  Type <span className="font-extrabold text-gray-800 tracking-widest">PROMOTE</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="PROMOTE"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30"
                  autoFocus
                />
              </div>

              {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-xl mb-3">{error}</p>}

              <div className="flex gap-3">
                <button onClick={() => setPageState('preview')}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handlePromote}
                  disabled={!canConfirm || promoting}
                  className="flex-1 py-3 bg-[#0B2447] text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-[#163d6a] transition-colors">
                  {promoting ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin" /> Promoting…
                    </span>
                  ) : 'Confirm Promotion'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
