import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import {
  ClipboardList, BookMarked, CheckCircle2, TrendingUp, Plus, Pencil, Trash2,
  Send, Undo2, FileDown, FileSpreadsheet, Trophy, TrendingDown,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import ExamFormModal, { ExamFormValues } from './exams/ExamFormModal'
import SubjectFormModal, { SubjectFormValues } from './exams/SubjectFormModal'
import { exportExamMarksToExcel } from '../../utils/examExcel'

interface Exam { id: number; examName: string; examType: string; academicYear: string; startDate: string; endDate: string; status: 'DRAFT' | 'PUBLISHED'; _count?: { marks: number } }
interface Subject { id: number; subjectName: string; subjectCode: string }
interface Analysis {
  schoolPassPct: number; avgMarks: number; totalMarks: number
  classWise: { className: string; passPercentage: number; total: number }[]
  subjectWise: { subjectName: string; passPercentage: number; average: number; total: number }[]
  topScorers: { studentId: number; name: string; roll: string; percentage: number }[]
  lowestScorers: { studentId: number; name: string; roll: string; percentage: number }[]
}

const TABS = ['Overview', 'Exams', 'Subjects', 'Analysis'] as const
type Tab = typeof TABS[number]

export default function Examinations() {
  const { token } = useAuth()
  const [tab, setTab] = useState<Tab>('Overview')
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [analysisExamId, setAnalysisExamId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const [examModal, setExamModal] = useState<{ mode: 'create' | 'edit'; exam?: Exam } | null>(null)
  const [subjectModal, setSubjectModal] = useState<{ mode: 'create' | 'edit'; subject?: Subject } | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const h = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])
  const hJson = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }), [token])

  const loadAll = async () => {
    setLoading(true)
    const [examsRes, subjRes] = await Promise.all([
      fetch('/api/exams', { headers: h }).then(r => r.json()),
      fetch('/api/subjects', { headers: h }).then(r => r.json()),
    ])
    if (examsRes.success) setExams(examsRes.data)
    if (subjRes.success) setSubjects(subjRes.data)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [token])

  const loadAnalysis = async (examId?: string) => {
    const url = examId ? `/api/exam-marks/meta/analysis?examId=${examId}` : '/api/exam-marks/meta/analysis'
    const res = await fetch(url, { headers: h }).then(r => r.json())
    if (res.success) setAnalysis(res.data)
  }

  useEffect(() => { if (tab === 'Analysis' || tab === 'Overview') loadAnalysis(analysisExamId) }, [tab, analysisExamId, exams.length])

  const publishedCount = exams.filter(e => e.status === 'PUBLISHED').length

  const saveExam = async (values: ExamFormValues) => {
    setSaving(true); setFormError(null)
    const isEdit = examModal?.mode === 'edit'
    const res = await fetch(isEdit ? `/api/exams/${examModal!.exam!.id}` : '/api/exams', {
      method: isEdit ? 'PUT' : 'POST', headers: hJson, body: JSON.stringify(values),
    }).then(r => r.json())
    setSaving(false)
    if (!res.success) { setFormError(res.message || 'Failed to save exam'); return }
    setExamModal(null); loadAll()
  }

  const deleteExam = async (id: number) => {
    if (!confirm('Delete this exam and all its marks? This cannot be undone.')) return
    setBusyId(id)
    const res = await fetch(`/api/exams/${id}`, { method: 'DELETE', headers: h }).then(r => r.json())
    setBusyId(null)
    if (!res.success) { alert(res.message || 'Failed to delete'); return }
    loadAll()
  }

  const togglePublish = async (exam: Exam) => {
    const action = exam.status === 'PUBLISHED' ? 'unpublish' : 'publish'
    if (action === 'publish' && !confirm('Publish results? Students will be notified and marks become read-only for teachers.')) return
    setBusyId(exam.id)
    const res = await fetch(`/api/exams/${exam.id}/${action}`, { method: 'POST', headers: h }).then(r => r.json())
    setBusyId(null)
    if (!res.success) { alert(res.message || 'Action failed'); return }
    loadAll()
  }

  const saveSubject = async (values: SubjectFormValues) => {
    setSaving(true); setFormError(null)
    const isEdit = subjectModal?.mode === 'edit'
    const res = await fetch(isEdit ? `/api/subjects/${subjectModal!.subject!.id}` : '/api/subjects', {
      method: isEdit ? 'PUT' : 'POST', headers: hJson, body: JSON.stringify(values),
    }).then(r => r.json())
    setSaving(false)
    if (!res.success) { setFormError(res.message || 'Failed to save subject'); return }
    setSubjectModal(null); loadAll()
  }

  const deleteSubject = async (id: number) => {
    if (!confirm('Delete this subject? This cannot be undone.')) return
    setBusyId(id)
    const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE', headers: h }).then(r => r.json())
    setBusyId(null)
    if (!res.success) { alert(res.message || 'Failed to delete'); return }
    loadAll()
  }

  const exportPdf = async () => {
    const url = analysisExamId ? `/api/exam-marks/meta/report-card?examId=${analysisExamId}` : ''
    void url
    alert('Select a student on the Analysis tab or use a student\'s report card from the Teacher/Student portal for individual PDFs. Use Export Excel below for a full marks sheet.')
  }

  const exportExcel = async () => {
    const url = analysisExamId ? `/api/exam-marks?examId=${analysisExamId}` : '/api/exam-marks'
    const res = await fetch(url, { headers: h }).then(r => r.json())
    if (res.success) exportExamMarksToExcel(res.data, `exam-marks-${analysisExamId || 'all'}.xlsx`)
  }

  if (loading) return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="h-8 w-56 bg-gray-200 rounded-lg animate-pulse mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-gov-border animate-pulse" />)}</div>
    </div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Examination & Marks Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">Create exams, manage subjects, and review results</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gov-border text-[#0B2447] hover:bg-gray-50">
            <FileSpreadsheet size={16} /> Export Excel
          </button>
          <button onClick={exportPdf} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gov-border text-[#0B2447] hover:bg-gray-50">
            <FileDown size={16} /> Export Info
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Exams', value: exams.length, icon: ClipboardList, color: 'bg-blue-50 text-blue-700' },
          { label: 'Subjects', value: subjects.length, icon: BookMarked, color: 'bg-violet-50 text-violet-700' },
          { label: 'Published Results', value: publishedCount, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Overall Pass %', value: analysis ? `${analysis.schoolPassPct}%` : '—', icon: TrendingUp, color: 'bg-amber-50 text-amber-700' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-gov-border shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}><c.icon size={18} /></div>
            <div><p className="text-xs text-gray-400">{c.label}</p><p className="text-xl font-bold text-[#0B2447]">{c.value}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-[#0B2447] text-white shadow-sm' : 'bg-white border border-gov-border text-gray-600 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gov-border shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#0B2447] mb-4">Class-wise Pass Percentage</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analysis?.classWise || []} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="className" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Pass %']} />
                <Bar dataKey="passPercentage" fill="#0B2447" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-gov-border shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#0B2447] mb-4">Subject-wise Average %</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analysis?.subjectWise || []} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="subjectName" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} formatter={(v) => [`${v}%`, 'Average']} />
                <Bar dataKey="average" radius={[6, 6, 0, 0]}>
                  {(analysis?.subjectWise || []).map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#0B2447' : '#D4AF37'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'Exams' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setFormError(null); setExamModal({ mode: 'create' }) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B2447] text-white hover:bg-[#163d6a]">
              <Plus size={16} /> Create Exam
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden">
            {exams.length === 0 ? <div className="p-10 text-center text-gray-400">No exams created yet</div> : (
              <>
                <div className="grid grid-cols-12 bg-[#0B2447] text-white px-4 py-3 text-xs font-semibold">
                  <div className="col-span-3">Exam Name</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Academic Year</div>
                  <div className="col-span-2">Dates</div>
                  <div className="col-span-1 text-center">Status</div>
                  <div className="col-span-2 text-center">Actions</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {exams.map(exam => (
                    <div key={exam.id} className="grid grid-cols-12 items-center px-4 py-3 hover:bg-gov-bg">
                      <div className="col-span-3 text-sm font-semibold text-gray-800">{exam.examName}</div>
                      <div className="col-span-2 text-xs text-gray-500">{exam.examType}</div>
                      <div className="col-span-2 text-xs text-gray-500">{exam.academicYear}</div>
                      <div className="col-span-2 text-xs text-gray-500">{new Date(exam.startDate).toLocaleDateString()} – {new Date(exam.endDate).toLocaleDateString()}</div>
                      <div className="col-span-1 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${exam.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{exam.status}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-center gap-1.5">
                        <button onClick={() => togglePublish(exam)} disabled={busyId === exam.id}
                          title={exam.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                          className={`p-1.5 rounded-lg ${exam.status === 'PUBLISHED' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'} disabled:opacity-40`}>
                          {exam.status === 'PUBLISHED' ? <Undo2 size={15} /> : <Send size={15} />}
                        </button>
                        <button onClick={() => { setFormError(null); setExamModal({ mode: 'edit', exam }) }}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"><Pencil size={15} /></button>
                        <button onClick={() => deleteExam(exam.id)} disabled={busyId === exam.id}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'Subjects' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setFormError(null); setSubjectModal({ mode: 'create' }) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B2447] text-white hover:bg-[#163d6a]">
              <Plus size={16} /> Add Subject
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.length === 0 ? <div className="col-span-full p-10 text-center text-gray-400 bg-white rounded-2xl border border-gov-border">No subjects added yet</div> : subjects.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-gov-border shadow-sm p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-gray-800">{s.subjectName}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{s.subjectCode}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => { setFormError(null); setSubjectModal({ mode: 'edit', subject: s }) }}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"><Pencil size={14} /></button>
                  <button onClick={() => deleteSubject(s.id)} disabled={busyId === s.id}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Analysis' && (
        <div>
          <div className="mb-5 max-w-xs">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Filter by Exam</label>
            <select value={analysisExamId} onChange={e => setAnalysisExamId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white">
              <option value="">All Exams</option>
              {exams.map(e => <option key={e.id} value={e.id}>{e.examName} ({e.academicYear})</option>)}
            </select>
          </div>

          {!analysis ? (
            <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gov-border">No marks data available yet</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gov-border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4"><Trophy size={18} className="text-[#D4AF37]" /><h2 className="text-base font-semibold text-[#0B2447]">Top Scorers</h2></div>
                <div className="space-y-2">
                  {analysis.topScorers.map((s, i) => (
                    <div key={s.studentId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gov-bg">
                      <span className="text-sm font-medium text-gray-700">{i + 1}. {s.name} <span className="text-xs text-gray-400 font-mono">({s.roll})</span></span>
                      <span className="text-sm font-bold text-emerald-600">{s.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gov-border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4"><TrendingDown size={18} className="text-red-500" /><h2 className="text-base font-semibold text-[#0B2447]">Needs Attention</h2></div>
                <div className="space-y-2">
                  {analysis.lowestScorers.map((s, i) => (
                    <div key={s.studentId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gov-bg">
                      <span className="text-sm font-medium text-gray-700">{i + 1}. {s.name} <span className="text-xs text-gray-400 font-mono">({s.roll})</span></span>
                      <span className="text-sm font-bold text-red-500">{s.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gov-border shadow-sm p-6 lg:col-span-2">
                <h2 className="text-base font-semibold text-[#0B2447] mb-4">Subject-wise Performance</h2>
                <div className="divide-y divide-gray-100">
                  {analysis.subjectWise.map(sw => (
                    <div key={sw.subjectName} className="flex items-center justify-between py-2.5">
                      <span className="text-sm text-gray-700 font-medium">{sw.subjectName}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">{sw.total} entries</span>
                        <span className="text-sm font-semibold text-[#0B2447]">Avg {sw.average}%</span>
                        <span className="text-sm font-semibold text-emerald-600">Pass {sw.passPercentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {examModal && (
        <ExamFormModal
          initial={examModal.mode === 'edit' ? examModal.exam : undefined}
          onClose={() => setExamModal(null)}
          onSave={saveExam}
          saving={saving}
          error={formError}
        />
      )}
      {subjectModal && (
        <SubjectFormModal
          initial={subjectModal.mode === 'edit' ? subjectModal.subject : undefined}
          onClose={() => setSubjectModal(null)}
          onSave={saveSubject}
          saving={saving}
          error={formError}
        />
      )}
    </div>
  )
}
