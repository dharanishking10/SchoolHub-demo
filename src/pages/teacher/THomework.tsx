import { useEffect, useState, useCallback, type Dispatch, type SetStateAction } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface HW { id: number; className: string; section: string; subject: string; title: string; description?: string; dueDate: string; status: string; createdAt: string }
const CLASSES = ['VI','VII','VIII','IX','X','XI','XII']
const SECTIONS = ['A','B']
const EMPTY = { className: 'X', section: 'A', subject: '', title: '', description: '', dueDate: '', status: 'ACTIVE' }

type HWFormData = typeof EMPTY

const Field = ({ label, name, type = 'text', required = false, form, setForm }: {
  label: string; name: keyof HWFormData; type?: string; required?: boolean
  form: HWFormData; setForm: Dispatch<SetStateAction<HWFormData>>
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <input type={type} value={form[name] as string} onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30" />
  </div>
)

export default function THomework() {
  const { token } = useAuth()
  const [homework, setHomework] = useState<HW[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<HW | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState<{ subject: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) { setProfile(d.data.user); setForm(f => ({ ...f, subject: d.data.user.subject || '' })) } })
  }, [token])

  const fetchHW = useCallback(() => {
    setLoading(true)
    fetch('/api/homework', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setHomework(d.data) }).finally(() => setLoading(false))
  }, [token])

  useEffect(() => { fetchHW() }, [fetchHW])

  const openCreate = () => { setForm({ ...EMPTY, subject: profile?.subject || '' }); setError(''); setModal('create') }
  const openEdit = (hw: HW) => { setSelected(hw); setForm({ className: hw.className, section: hw.section, subject: hw.subject, title: hw.title, description: hw.description || '', dueDate: hw.dueDate, status: hw.status }); setError(''); setModal('edit') }
  const openDelete = (hw: HW) => { setSelected(hw); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null); setError('') }

  const handleSave = async () => {
    if (!form.title || !form.className || !form.section || !form.subject || !form.dueDate) { setError('Fill all required fields'); return }
    setSaving(true); setError('')
    const url = modal === 'edit' ? `/api/homework/${selected!.id}` : '/api/homework'
    const method = modal === 'edit' ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
    const json = await res.json(); setSaving(false)
    if (json.success) { closeModal(); fetchHW() }
    else setError(json.message || 'Failed')
  }

  const handleDelete = async () => {
    if (!selected) return; setSaving(true)
    await fetch(`/api/homework/${selected.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setSaving(false); closeModal(); fetchHW()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Homework</h1>
          <p className="text-gray-500 text-sm mt-0.5">{homework.length} assignment{homework.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] shadow-sm">
          <Plus size={16} className="text-secondary" /> Assign
        </button>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse" />)}</div>
      ) : homework.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><p className="text-lg font-semibold">No homework assigned yet</p><p className="text-sm mt-1">Click "Assign" to create homework</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {homework.map((hw, i) => (
            <motion.div key={hw.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl shadow-sm border border-gov-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${hw.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{hw.status}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(hw)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"><Edit2 size={13} /></button>
                  <button onClick={() => openDelete(hw)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 className="font-bold text-gray-800 text-sm leading-snug mb-1">{hw.title}</h3>
              {hw.description && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{hw.description}</p>}
              <div className="flex items-center gap-3 text-xs text-gray-400 border-t border-gray-100 pt-2 mt-2">
                <span className="font-semibold text-[#0B2447]">Std {hw.className}-{hw.section}</span>
                <span>{hw.subject}</span>
                <span className="ml-auto">Due: {hw.dueDate}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {(modal === 'create' || modal === 'edit') && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between px-6 py-4 bg-[#0B2447] rounded-t-2xl">
                <h2 className="text-white font-bold text-lg">{modal === 'create' ? 'Assign Homework' : 'Edit Homework'}</h2>
                <button onClick={closeModal} className="text-white/70 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Class<span className="text-red-500 ml-0.5">*</span></label>
                    <select value={form.className} onChange={e => setForm(f => ({ ...f, className: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
                      {CLASSES.map(c => <option key={c} value={c}>Std {c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Section<span className="text-red-500 ml-0.5">*</span></label>
                    <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
                      {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                  </div>
                </div>
                <Field label="Subject" name="subject" required form={form} setForm={setForm} />
                <Field label="Title" name="title" required form={form} setForm={setForm} />
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none resize-none" placeholder="Optional description…" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Due Date" name="dueDate" type="date" required form={form} setForm={setForm} />
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
                      <option value="ACTIVE">Active</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
                {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                <div className="flex gap-3 pt-1">
                  <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-[#0B2447] text-white rounded-xl text-sm font-semibold hover:bg-[#163d6a] disabled:opacity-60">
                    {saving ? 'Saving…' : modal === 'create' ? 'Assign' : 'Save'}
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
              <h3 className="font-bold text-gray-800 text-lg mb-1">Delete Homework?</h3>
              <p className="text-gray-500 text-sm mb-6">"{selected.title}" will be permanently deleted.</p>
              <div className="flex gap-3">
                <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
                <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-60">
                  {saving ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
