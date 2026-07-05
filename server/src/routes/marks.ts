import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { notify, audit } from '../utils/activityLog'

const router = Router()
const prisma = new PrismaClient()

function calcGrade(obtained: number, total: number): string {
  const pct = (obtained / total) * 100
  if (pct >= 91) return 'A+'
  if (pct >= 81) return 'A'
  if (pct >= 71) return 'B+'
  if (pct >= 61) return 'B'
  if (pct >= 51) return 'C'
  if (pct >= 35) return 'D'
  return 'F'
}

// GET /api/marks?studentId=&examName=&subject=
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, examName, subject } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}

    if (req.user!.role === 'STUDENT') {
      where.studentId = req.user!.userId
    } else if (studentId) {
      where.studentId = parseInt(studentId)
    }
    if (examName) where.examName = examName
    if (subject) where.subject = subject

    const marks = await prisma.marks.findMany({
      where,
      include: { student: { select: { id: true, fullName: true, rollNumber: true, className: true, section: true } } },
      orderBy: [{ examName: 'asc' }, { subject: 'asc' }],
    })
    res.json({ success: true, data: marks })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// GET /api/marks/summary?studentId=
router.get('/summary', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sid = req.user!.role === 'STUDENT' ? req.user!.userId : parseInt((req.query.studentId as string) || '0')
    if (!sid) { res.status(400).json({ success: false, message: 'studentId required' }); return }

    const marks = await prisma.marks.findMany({ where: { studentId: sid }, orderBy: { examName: 'asc' } })
    const exams = [...new Set(marks.map(m => m.examName))]
    const byExam = exams.map(exam => {
      const items = marks.filter(m => m.examName === exam)
      const obtained = items.reduce((s, m) => s + m.marksObtained, 0)
      const total = items.reduce((s, m) => s + m.totalMarks, 0)
      return { examName: exam, subjects: items, totalObtained: obtained, grandTotal: total, percentage: total > 0 ? Math.round((obtained / total) * 100) : 0 }
    })
    res.json({ success: true, data: { marks, byExam } })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/marks
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const { studentId, subject, examName, marksObtained, totalMarks } = req.body
    if (!studentId || !subject || !examName || marksObtained === undefined || !totalMarks) { res.status(400).json({ success: false, message: 'All fields required' }); return }
    const grade = calcGrade(marksObtained, totalMarks)
    const mark = await prisma.marks.upsert({
      where: { studentId_subject_examName: { studentId, subject, examName } },
      update: { marksObtained, totalMarks, grade, markedBy: req.user!.userId },
      create: { studentId, subject, examName, marksObtained, totalMarks, grade, markedBy: req.user!.userId },
    })
    await notify(studentId, 'STUDENT', 'marks', 'Marks Published', `Your ${subject} marks for ${examName} have been published (${marksObtained}/${totalMarks}, Grade ${grade})`)
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Marks Updated', `${subject} - ${examName} for student #${studentId}`)
    res.json({ success: true, data: mark })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// PUT /api/marks/:id
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const { marksObtained, totalMarks } = req.body
    const grade = calcGrade(marksObtained, totalMarks)
    const mark = await prisma.marks.update({ where: { id: parseInt(req.params.id) }, data: { marksObtained, totalMarks, grade } })
    res.json({ success: true, data: mark })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// DELETE /api/marks/:id
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    await prisma.marks.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true, message: 'Deleted' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
