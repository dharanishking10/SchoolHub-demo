import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Plus, Trash2, X, Clock, Users, GraduationCap, School } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Announcement { id: number; title: string; message: string; audience: string; className?: string | null; section?: string | null; createdByName: string; createdByRole: string; status: string; scheduledAt?: string | null; createdAt: string }

const CLASSES = ['VI','VII','VIII','IX','X','XI','XII']
const SECTIONS = ['A','B']
const AUD_ICON: Record<string, typeof Users> = { ALL: School, TEACHERS: Users, STUDENTS: GraduationCap, CLASS: GraduationCap }
const AUD_LABEL: Record<string, string> = { ALL: 'Everyone', TEACHERS: 'All Teachers', STUDENTS: 'All Students', CLASS: 'Specific Class' }

export default function Announcements() {
  const { token } = useAuth()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('ALL')
  const [className, setClassName] = useState('X')
  const [section, setSection] = useState('A')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    fetch('/api/announcements', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setItems(d.data) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [token])

  const submit = async () => {
    if (!title.trim() || !message.trim()) { setError('Title and message are required'); return }
    setSaving(true); setError('')
    const body: Record<string, unknown> = { title: title.trim(), message: message.trim(), audience }
    if (audience === 'CLASS') { body.className = className; body.section = section }
    const res = await fetch('/api/announcements', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
    })
    const json = await res.json()
    setSaving(false)
    if (!json.success) { setError(json.message || 'Failed to create'); return }
    setOpen(false); setTitle(''); setMessage(''); setAudience('ALL')
    load()
  }

  const remove = async (id: number) => {
    if (!confirm('Delete this announcement?')) return
    await fetch(`/api/announcements/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Announcements</h1>
          <p className="text-gray-500 text-sm mt-0.5">Broadcast messages to teachers, students, or specific classes</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B2447] text-white hover:bg-[#163d6a] transition-colors">
          <Plus size={16} /> New Announcement
        </button>
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
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-gray-800">{a.title}</h3>
                  <button onClick={() => remove(a.id)} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={15} /></button>
                </div>
                <p className="text-sm text-gray-600 mt-1">{a.message}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
                  <span className="px-2 py-0.5 rounded-full bg-gov-bg font-semibold text-gray-500">
                    {AUD_LABEL[a.audience]}{a.audience === 'CLASS' ? ` — Std ${a.className}-${a.section}` : ''}
                  </span>
                  <span>By {a.createdByName} ({a.createdByRole})</span>
                  <span className="flex items-center gap-1"><Clock size={11} /> {new Date(a.createdAt).toLocaleString()}</span>
                  {a.status === 'SCHEDULED' && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-semibold">Scheduled</span>}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0B2447]">New Announcement</h3>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>
              {error && <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30" placeholder="Announcement title" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={500} rows={4} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 resize-none" placeholder="Write your announcement..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Audience</label>
                  <select value={audience} onChange={e => setAudience(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
                    <option value="ALL">Everyone</option>
                    <option value="TEACHERS">All Teachers</option>
                    <option value="STUDENTS">All Students</option>
                    <option value="CLASS">Specific Class</option>
                  </select>
                </div>
                {audience === 'CLASS' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Class</label>
                      <select value={className} onChange={e => setClassName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
                        {CLASSES.map(c => <option key={c} value={c}>Std {c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Section</label>
                      <select value={section} onChange={e => setSection(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
                        {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end mt-5">
                <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200">Cancel</button>
                <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#0B2447] hover:bg-[#163d6a] disabled:opacity-60">
                  {saving ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
