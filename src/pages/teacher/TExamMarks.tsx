import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Save, CheckCircle, Lock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

interface Exam { id: number; examName: string; examType: string; academicYear: string; status: 'DRAFT' | 'PUBLISHED' }
interface Subject { id: number; subjectName: string; subjectCode: string }
interface Student { id: number; fullName: string; rollNumber: string; className: string; section: string }
interface Mark { id: number; studentId: number; subjectId: number; examId: number; marksObtained: number; maximumMarks: number; grade?: string | null }

const CLASSES = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const SECTIONS = ['A', 'B']

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

export default function TExamMarks() {
  const { token } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [academicYear, setAcademicYear] = useState('')
  const [examId, setExamId] = useState('')
  const [className, setClassName] = useState('X')
  const [section, setSection] = useState('A')
  const [subjectId, setSubjectId] = useState('')
  const [maxMarks, setMaxMarks] = useState('100')
  const [students, setStudents] = useState<Student[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [inputs, setInputs] = useState<Record<number, { obtained: string; remarks: string }>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const h = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])
  const hJson = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token])

  useEffect(() => {
    Promise.all([
      fetch('/api/exams', { headers: h }).then(r => r.json()),
      fetch('/api/subjects', { headers: h }).then(r => r.json()),
    ]).then(([examsRes, subjRes]) => {
      if (examsRes.success) setExams(examsRes.data)
      if (subjRes.success) { setSubjects(subjRes.data); if (subjRes.data.length > 0) setSubjectId(String(subjRes.data[0].id)) }
    })
  }, [token])

  const years = useMemo(() => [...new Set(exams.map(e => e.academicYear))], [exams])
  useEffect(() => { if (years.length > 0 && !academicYear) setAcademicYear(years[0]) }, [years])

  const examsForYear = exams.filter(e => e.academicYear === academicYear)
  useEffect(() => { if (examsForYear.length > 0 && !examsForYear.some(e => String(e.id) === examId)) setExamId(String(examsForYear[0].id)) }, [academicYear, exams])

  const selectedExam = exams.find(e => String(e.id) === examId)
  const isLocked = selectedExam?.status === 'PUBLISHED'

  const loadData = async () => {
    if (!examId || !subjectId) return
    setLoading(true); setError(null)
    const [stuRes, marksRes] = await Promise.all([
      fetch(`/api/students?className=${className}&section=${section}&limit=100&status=ACTIVE`, { headers: h }).then(r => r.json()),
      fetch(`/api/exam-marks?examId=${examId}&className=${className}&section=${section}&subjectId=${subjectId}`, { headers: h }).then(r => r.json()),
    ])
    const stuList: Student[] = stuRes.success ? stuRes.data.students : []
    setStudents(stuList)
    const mList: Mark[] = marksRes.success ? marksRes.data : []
    setMarks(mList)
    const init: Record<number, { obtained: string; remarks: string }> = {}
    stuList.forEach(s => {
      const existing = mList.find(m => m.studentId === s.id)
      init[s.id] = existing ? { obtained: String(existing.marksObtained), remarks: '' } : { obtained: '', remarks: '' }
      if (existing) setMaxMarks(String(existing.maximumMarks))
    })
    setInputs(init)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [examId, className, section, subjectId])

  const setInput = (id: number, field: 'obtained' | 'remarks', val: string) =>
    setInputs(p => ({ ...p, [id]: { ...p[id], [field]: val } }))

  const saveAll = async () => {
    setSaving(true); setError(null)
    const max = parseFloat(maxMarks) || 100
    const entries = students.filter(s => inputs[s.id]?.obtained !== '').map(s => ({
      studentId: s.id, className, section, subjectId: parseInt(subjectId), examId: parseInt(examId),
      marksObtained: parseFloat(inputs[s.id].obtained), maximumMarks: max, remarks: inputs[s.id].remarks || undefined,
    }))
    if (entries.length === 0) { setSaving(false); return }
    const res = await fetch('/api/exam-marks', { method: 'POST', headers: hJson, body: JSON.stringify({ entries }) }).then(r => r.json())
    setSaving(false)
    if (!res.success) { setError(res.message || 'Failed to save marks'); return }
    setSaved(true); setTimeout(() => setSaved(false), 2500)
    loadData()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B2447]">Examination Marks Entry</h1>
        <p className="text-gray-500 text-sm mt-0.5">Enter and manage marks for your students</p>
      </motion.div>

      <div className="bg-white rounded-2xl shadow-sm border border-gov-border p-5 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Academic Year</label>
            <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Exam</label>
            <select value={examId} onChange={e => setExamId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
              {examsForYear.map(e => <option key={e.id} value={e.id}>{e.examName}</option>)}
            </select>
          </div>
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
            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none">
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subjectName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Maximum Marks</label>
            <input type="number" min={1} value={maxMarks} onChange={e => setMaxMarks(e.target.value)} disabled={isLocked}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none disabled:bg-gray-50" />
          </div>
        </div>
      </div>

      {isLocked && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
          <Lock size={16} /> Results for this exam are published — marks are read-only.
        </div>
      )}

      {error && <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}

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
                <div className="col-span-1 text-center">%</div>
                <div className="col-span-2 text-center">Grade</div>
              </div>
              <div className="divide-y divide-gray-100">
                {students.map((s, i) => {
                  const inp = inputs[s.id] || { obtained: '', remarks: '' }
                  const max = parseFloat(maxMarks) || 100
                  const pct = inp.obtained ? Math.round((parseFloat(inp.obtained) / max) * 100) : null
                  const grade = pct !== null ? calcGrade(parseFloat(inp.obtained), max) : '—'
                  return (
                    <div key={s.id} className="grid grid-cols-12 items-center px-4 py-2.5 hover:bg-gov-bg">
                      <div className="col-span-1 text-xs text-gray-400">{i + 1}</div>
                      <div className="col-span-2 font-mono text-xs text-gray-600">{s.rollNumber}</div>
                      <div className="col-span-4 text-sm font-semibold text-gray-800">{s.fullName}</div>
                      <div className="col-span-2 flex justify-center">
                        <input type="number" min={0} max={max} value={inp.obtained} disabled={isLocked}
                          onChange={e => setInput(s.id, 'obtained', e.target.value)}
                          className="w-20 px-2 py-1 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/30 disabled:bg-gray-50" />
                      </div>
                      <div className="col-span-1 text-center text-xs font-semibold text-gray-700">{pct !== null ? `${pct}%` : '—'}</div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span className={`text-xs font-bold ${grade === 'F' ? 'text-red-500' : grade.startsWith('A') ? 'text-emerald-600' : 'text-gray-700'}`}>{grade}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
      </div>

      {students.length > 0 && !isLocked && (
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
