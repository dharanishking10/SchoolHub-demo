import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Users, GraduationCap, FileText, ClipboardList, Megaphone } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface SearchResults {
  students: { id: number; fullName: string; admissionNumber: string; rollNumber: string; className: string; section: string }[]
  teachers: { id: number; fullName: string; employeeId: string; subject: string }[]
  attendance: unknown[]
  homework: { id: number; title: string; subject: string; className?: string; section?: string; dueDate: string }[]
  marks: { id: number; subject: string; examName: string; marksObtained: number; totalMarks: number; student?: { fullName: string; rollNumber: string } }[]
  announcements: { id: number; title: string; message: string }[]
}

const EMPTY: SearchResults = { students: [], teachers: [], attendance: [], homework: [], marks: [], announcements: [] }

export default function GlobalSearch() {
  const { token } = useAuth()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResults>(EMPTY)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (q.trim().length < 2) { setResults(EMPTY); return }
    setLoading(true)
    const handle = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => { if (d.success) setResults(d.data) }).finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(handle)
  }, [q, token])

  const totalCount = results.students.length + results.teachers.length + results.homework.length + results.marks.length + results.announcements.length

  return (
    <div className="relative flex-1 max-w-md" ref={ref}>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search students, teachers, marks, homework..."
          className="w-full pl-9 pr-8 py-2 text-sm bg-gov-bg border border-gov-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2447]/20 focus:bg-white transition-colors"
        />
        {q && (
          <button onClick={() => { setQ(''); setResults(EMPTY) }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && q.trim().length >= 2 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            className="absolute left-0 mt-2 w-[26rem] max-w-[90vw] max-h-[26rem] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gov-border z-50 p-2">
            {loading ? (
              <p className="text-center text-gray-400 text-sm py-6">Searching…</p>
            ) : totalCount === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">No results for "{q}"</p>
            ) : (
              <div className="space-y-1">
                {results.students.length > 0 && (
                  <Section title="Students" icon={GraduationCap}>
                    {results.students.map(s => (
                      <Row key={s.id} title={s.fullName} sub={`Roll ${s.rollNumber} · Std ${s.className}-${s.section}`} />
                    ))}
                  </Section>
                )}
                {results.teachers.length > 0 && (
                  <Section title="Teachers" icon={Users}>
                    {results.teachers.map(t => (
                      <Row key={t.id} title={t.fullName} sub={`${t.subject} · ${t.employeeId}`} />
                    ))}
                  </Section>
                )}
                {results.homework.length > 0 && (
                  <Section title="Homework" icon={FileText}>
                    {results.homework.map(h => (
                      <Row key={h.id} title={h.title} sub={`${h.subject}${h.className ? ` · Std ${h.className}-${h.section}` : ''} · Due ${h.dueDate}`} />
                    ))}
                  </Section>
                )}
                {results.marks.length > 0 && (
                  <Section title="Marks" icon={ClipboardList}>
                    {results.marks.map(m => (
                      <Row key={m.id} title={`${m.subject} — ${m.examName}`} sub={m.student ? `${m.student.fullName} (${m.student.rollNumber}) · ${m.marksObtained}/${m.totalMarks}` : `${m.marksObtained}/${m.totalMarks}`} />
                    ))}
                  </Section>
                )}
                {results.announcements.length > 0 && (
                  <Section title="Announcements" icon={Megaphone}>
                    {results.announcements.map(a => (
                      <Row key={a.id} title={a.title} sub={a.message} />
                    ))}
                  </Section>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Search; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
        <Icon size={11} /> {title}
      </div>
      {children}
    </div>
  )
}

function Row({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-2.5 py-2 rounded-lg hover:bg-gov-bg cursor-default">
      <p className="text-sm font-semibold text-gray-700 truncate">{title}</p>
      <p className="text-xs text-gray-400 truncate">{sub}</p>
    </div>
  )
}
