import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { generateReportCardPdf } from '../../utils/reportCardPdf'

interface MarkItem { id: number; marksObtained: number; maximumMarks: number; grade?: string | null; subject: { subjectName: string } }
interface ExamGroup {
  examId: number; examName: string; examType: string; academicYear: string; status: string
  subjects: MarkItem[]; totalObtained: number; grandTotal: number; percentage: number; grade: string; result: string
}

const GRADE_COLOR: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-700',
  'A': 'bg-emerald-50 text-emerald-600',
  'B+': 'bg-blue-100 text-blue-700',
  'B': 'bg-blue-50 text-blue-600',
  'C': 'bg-amber-100 text-amber-700',
  'D': 'bg-orange-100 text-orange-700',
  'F': 'bg-red-100 text-red-600',
}

export default function SResults() {
  const { token } = useAuth()
  const [byExam, setByExam] = useState<ExamGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [activeExamId, setActiveExamId] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const h = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token])

  useEffect(() => {
    fetch('/api/exam-marks/summary', { headers: h })
      .then(r => r.json()).then(d => {
        if (d.success) {
          setByExam(d.data.byExam)
          if (d.data.byExam.length > 0) setActiveExamId(d.data.byExam[0].examId)
        }
      }).finally(() => setLoading(false))
  }, [token])

  const active = byExam.find(e => e.examId === activeExamId)

  const downloadReportCard = async () => {
    if (!active) return
    setDownloading(true); setDownloadError(null)
    const res = await fetch(`/api/exam-marks/meta/report-card?examId=${active.examId}`, { headers: h }).then(r => r.json())
    setDownloading(false)
    if (!res.success) { setDownloadError(res.message || 'Failed to generate report card'); return }
    generateReportCardPdf(res.data)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0B2447]">Examination Results</h1>
          <p className="text-gray-500 text-sm mt-0.5">Published exam-wise performance report</p>
        </div>
        {active && (
          <button onClick={downloadReportCard} disabled={downloading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B2447] text-white hover:bg-[#163d6a] disabled:opacity-60">
            <Download size={16} /> {downloading ? 'Preparing…' : 'Download Report Card'}
          </button>
        )}
      </motion.div>

      {downloadError && (
        <div className="mb-5 flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <span>{downloadError}</span>
          <button onClick={() => setDownloadError(null)} className="text-red-400 hover:text-red-600 font-bold">×</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl border animate-pulse" />)}</div>
      ) : byExam.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gov-border">
          <p className="text-lg font-semibold">No published results yet</p>
          <p className="text-sm mt-1">Your results will appear here once published by the headmaster</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-5 flex-wrap">
            {byExam.map(exam => (
              <button key={exam.examId} onClick={() => setActiveExamId(exam.examId)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeExamId === exam.examId ? 'bg-[#0B2447] text-white shadow-sm' : 'bg-white border border-gov-border text-gray-600 hover:bg-gray-50'}`}>
                {exam.examName}
              </button>
            ))}
          </div>

          {active && (
            <motion.div key={active.examId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="bg-[#0B2447] rounded-2xl p-5 mb-5 flex flex-wrap gap-6 items-center">
                <div>
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Total Score</p>
                  <p className="text-white text-3xl font-extrabold">{active.totalObtained}<span className="text-white/50 text-base font-normal"> / {active.grandTotal}</span></p>
                </div>
                <div>
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Percentage</p>
                  <p className={`text-3xl font-extrabold ${active.percentage >= 75 ? 'text-emerald-400' : active.percentage >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{active.percentage}%</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Grade</p>
                  <p className="text-white text-3xl font-extrabold">{active.grade}</p>
                </div>
                <div>
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Result</p>
                  <p className={`text-3xl font-extrabold ${active.result === 'PASS' ? 'text-emerald-400' : 'text-red-400'}`}>{active.result}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gov-border overflow-hidden">
                <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100 px-5 py-3 text-xs font-semibold text-gray-500">
                  <div className="col-span-4">Subject</div>
                  <div className="col-span-2 text-center">Marks</div>
                  <div className="col-span-2 text-center">Total</div>
                  <div className="col-span-2 text-center">%</div>
                  <div className="col-span-2 text-center">Grade</div>
                </div>
                <div className="divide-y divide-gray-100">
                  {active.subjects.map((m, i) => {
                    const pct = Math.round((m.marksObtained / m.maximumMarks) * 100)
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="grid grid-cols-12 items-center px-5 py-3.5 hover:bg-gov-bg transition-colors">
                        <div className="col-span-4 font-semibold text-sm text-gray-800">{m.subject.subjectName}</div>
                        <div className="col-span-2 text-center text-sm font-bold text-[#0B2447]">{m.marksObtained}</div>
                        <div className="col-span-2 text-center text-sm text-gray-500">{m.maximumMarks}</div>
                        <div className="col-span-2 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold text-gray-700">{pct}%</span>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${GRADE_COLOR[m.grade || 'F'] || 'bg-gray-100 text-gray-600'}`}>{m.grade || '—'}</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                <div className="grid grid-cols-12 bg-[#0B2447] text-white px-5 py-3 text-sm font-bold">
                  <div className="col-span-4">Total</div>
                  <div className="col-span-2 text-center">{active.totalObtained}</div>
                  <div className="col-span-2 text-center">{active.grandTotal}</div>
                  <div className="col-span-2 text-center">{active.percentage}%</div>
                  <div className="col-span-2 text-center">{active.grade}</div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
