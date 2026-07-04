import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Save, X, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Student { id: number; fullName: string; rollNumber: string; className: string; section: string }
interface Mark { id: number; studentId: number; subject: string; examName: string; marksObtained: number; totalMarks: number; grade?: string; student: { fullName: string; rollNumber: string } }

const CLASSES = ['VI','VII','VIII','IX','X','XI','XII']
const SECTIONS = ['A','B']
const EXAMS = ['Unit Test 1','Unit Test 2','Half Yearly','Annual','Practical']

function calcGrade(obtained: number, total: number): string {
  const p = (obtained / total) * 100
  if (p >= 91) return 'A+'
  if (p >= 81) return 'A'
  if (p >= 71) return 'B+'
  if (p >= 61) return 'B'
  if (p >= 51) return 'C'
  if (p >= 35) return 'D'
  return 'F'
}

export default function TMarks() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<{ subject: string } | null>(null)
  const [className, setClassName] = useState('X')
  const [section, setSection] = useState('A')
  const [examName, setExamName] = useState('Unit Test 1')
  const [students, setStudents] = useState<Student[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [inputs, setInputs] = useState<Record<number, { obtained: string; total: string }>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [totalMarks, setTotalMarks] = useState('100')

  useEffect(() => {
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { if (d.success) setProfile(d.data.user) })
  }, [token])

  const loadData = async () => {
    if (!profile?.subject) return
    setLoading(true)
    const h = { Authorization: `Bearer ${token}` }
    const [stuRes, marksRes] = await Promise.all([
      fetch(`/api/students?className=${className}&section=${section}&limit=50&status=ACTIVE`, { headers: h }).then(r => r.json()),
      fetch(`/api/marks?examName=${encodeURIComponent(examName)}`, { headers: h }).then(r => r.json()),
    ])
    const stuList: Student[] = stuRes.success ? stuRes.data.students : []
    setStudents(stuList)
    const mList: Mark[] = marksRes.success ? marksRes.data.filter((m: Mark) => m.subject === profile.subject && stuList.some(s => s.id === m.studentId)) : []
    setMarks(mList)
    const init: Record<number, { obtained: string; total: string }> = {}
    stuList.forEach(s => {
      const existing = mList.find(m => m.studentId === s.id)
      init[s.id] = existing ? { obtained: String(existing.marksObtained), total: String(existing.totalMarks) } : { obtained: '', total: totalMarks }
    })
    setInputs(init)
    setLoading(false)
  }

  useEffect(() => { if (profile) loadData() }, [className, section, examName, profile])

  const setInput = (id: number, field: 'obtained' | 'total', val: string) =>
    setInputs(p => ({ ...p, [id]: { ...p[id], [field]: val } }))

  const saveAll = async () => {
    setSaving(true)
    const toSave = students.filter(s => inputs[s.id]?.obtained !== '')
    await Promise.all(toSave.map(s =>
      fetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId: s.id, subject: profile!.subject, examName, marksObtained: parseFloat(inputs[s.id].obtained), totalMarks: parseFloat(inputs[s.id].total || totalMarks) }),
      })
    ))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    loadData()
  }

  const deleteMark = async (id: number) => {
    setDeleting(id)
    await fetch(`/api/marks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    setDeleting(null); loadData()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">Marks Management</h1>
        <p className="text-gray-500 text-sm mt-0.5">Subject: <span className="font-semibold text-[#0B2447]">{profile?.subject || '…'}</span></p>
      </motion.div>

      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-5 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Exam</label>
            <select value={examName} onChange={e => setExamName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
              {EXAMS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Total Marks</label>
            <input type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden mb-5">
        {loading ? <div className="p-8 text-center text-gray-400">Loading…</div>
          : students.length === 0 ? <div className="p-8 text-center text-gray-400">No students in Std {className}-{section}</div>
          : (
            <>
              <div className="grid grid-cols-12 bg-[#0B2447] text-white px-4 py-3 text-xs font-semibold">
                <div className="col-span-1">#</div>
                <div className="col-span-2">Roll</div>
                <div className="col-span-4">Name</div>
                <div className="col-span-2 text-center">Marks</div>
                <div className="col-span-1 text-center">Total</div>
                <div className="col-span-1 text-center">%</div>
                <div className="col-span-1 text-center">Grade</div>
              </div>
              <div className="divide-y divide-gray-100">
                {students.map((s, i) => {
                  const inp = inputs[s.id] || { obtained: '', total: totalMarks }
                  const pct = inp.obtained && inp.total ? Math.round((parseFloat(inp.obtained) / parseFloat(inp.total)) * 100) : null
                  const grade = pct !== null ? calcGrade(parseFloat(inp.obtained), parseFloat(inp.total)) : '—'
                  const existing = marks.find(m => m.studentId === s.id)
                  return (
                    <div key={s.id} className="grid grid-cols-12 items-center px-4 py-2.5 hover:bg-gov-bg">
                      <div className="col-span-1 text-xs text-gray-400">{i + 1}</div>
                      <div className="col-span-2 font-mono text-xs text-gray-600">{s.rollNumber}</div>
                      <div className="col-span-4 text-sm font-semibold text-gray-800">{s.fullName}</div>
                      <div className="col-span-2 flex justify-center">
                        <input type="number" min={0} max={parseFloat(inp.total)} value={inp.obtained}
                          onChange={e => setInput(s.id, 'obtained', e.target.value)}
                          className="w-16 px-2 py-1 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30" />
                      </div>
                      <div className="col-span-1 text-center text-xs text-gray-500">{inp.total}</div>
                      <div className="col-span-1 text-center text-xs font-semibold text-gray-700">{pct !== null ? `${pct}%` : '—'}</div>
                      <div className="col-span-1 flex items-center justify-center gap-1">
                        <span className={`text-xs font-bold ${grade === 'F' ? 'text-red-500' : grade.startsWith('A') ? 'text-emerald-600' : 'text-gray-700'}`}>{grade}</span>
                        {existing && <button onClick={() => deleteMark(existing.id)} disabled={deleting === existing.id} className="p-0.5 hover:text-red-500 text-gray-300 transition-colors"><Trash2 size={11} /></button>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
      </div>

      {students.length > 0 && (
        <div className="flex justify-end gap-3">
          <button onClick={saveAll} disabled={saving}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm shadow-sm transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-[#0B2447] text-white hover:bg-[#163d6a]'} disabled:opacity-60`}>
            {saved ? <><CheckCircle size={16} /> Saved!</> : saving ? 'Saving…' : <><Save size={16} /> Save Marks</>}
          </button>
        </div>
      )}
    </div>
  )
}
