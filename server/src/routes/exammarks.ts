import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { notify, audit } from '../utils/activityLog'

const router = Router()
const prisma = new PrismaClient()

function calcGrade(obtained: number, max: number): string {
  const pct = (obtained / max) * 100
  if (pct >= 91) return 'A+'
  if (pct >= 81) return 'A'
  if (pct >= 71) return 'B+'
  if (pct >= 61) return 'B'
  if (pct >= 51) return 'C'
  if (pct >= 35) return 'D'
  return 'F'
}

async function teacherOwnsStudent(teacherId: number, studentId: number): Promise<boolean> {
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { createdByTeacherId: true } })
  return student?.createdByTeacherId === teacherId
}

const markInclude = {
  student: { select: { id: true, fullName: true, rollNumber: true, admissionNumber: true, className: true, section: true } },
  subject: { select: { id: true, subjectName: true, subjectCode: true } },
  exam: { select: { id: true, examName: true, examType: true, academicYear: true, status: true } },
}

// GET /api/exam-marks
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { examId, className, section, subjectId, studentId } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}

    if (req.user!.role === 'STUDENT') {
      where.studentId = req.user!.userId
      where.exam = { status: 'PUBLISHED' }
    } else if (req.user!.role === 'TEACHER') {
      if (studentId) {
        const owns = await teacherOwnsStudent(req.user!.userId, parseInt(studentId))
        if (!owns) { res.status(403).json({ success: false, message: 'You can only view marks for your own students' }); return }
        where.studentId = parseInt(studentId)
      } else {
        where.student = { createdByTeacherId: req.user!.userId }
      }
    } else if (studentId) {
      where.studentId = parseInt(studentId)
    }

    if (examId) where.examId = parseInt(examId)
    if (className) where.className = className
    if (section) where.section = section
    if (subjectId) where.subjectId = parseInt(subjectId)

    const marks = await prisma.mark.findMany({ where, include: markInclude, orderBy: [{ studentId: 'asc' }, { subjectId: 'asc' }] })
    res.json({ success: true, data: marks })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// GET /api/exam-marks/summary?studentId=
router.get('/summary', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sid = req.user!.role === 'STUDENT' ? req.user!.userId : parseInt((req.query.studentId as string) || '0')
    if (!sid) { res.status(400).json({ success: false, message: 'studentId required' }); return }

    if (req.user!.role === 'TEACHER') {
      const owns = await teacherOwnsStudent(req.user!.userId, sid)
      if (!owns) { res.status(403).json({ success: false, message: 'You can only view marks for your own students' }); return }
    }

    const where: Record<string, unknown> = { studentId: sid }
    if (req.user!.role === 'STUDENT') where.exam = { status: 'PUBLISHED' }

    const marks = await prisma.mark.findMany({ where, include: markInclude, orderBy: [{ examId: 'asc' }, { subjectId: 'asc' }] })
    const examIds = [...new Set(marks.map(m => m.examId))]
    const byExam = examIds.map(eid => {
      const items = marks.filter(m => m.examId === eid)
      const obtained = items.reduce((s, m) => s + m.marksObtained, 0)
      const max = items.reduce((s, m) => s + m.maximumMarks, 0)
      const percentage = max > 0 ? Math.round((obtained / max) * 100) : 0
      const result = items.every(m => (m.marksObtained / m.maximumMarks) * 100 >= 35) ? 'PASS' : 'FAIL'
      return {
        examId: eid,
        examName: items[0].exam.examName,
        examType: items[0].exam.examType,
        academicYear: items[0].exam.academicYear,
        status: items[0].exam.status,
        subjects: items,
        totalObtained: obtained,
        grandTotal: max,
        percentage,
        grade: calcGrade(obtained, max),
        result,
      }
    })
    res.json({ success: true, data: { marks, byExam } })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/exam-marks — bulk save (upsert)
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const { entries } = req.body as { entries: { studentId: number; className: string; section: string; subjectId: number; examId: number; marksObtained: number; maximumMarks: number; remarks?: string }[] }
    if (!Array.isArray(entries) || entries.length === 0) { res.status(400).json({ success: false, message: 'No entries provided' }); return }

    const examIds = [...new Set(entries.map(e => e.examId))]
    const exams = await prisma.exam.findMany({ where: { id: { in: examIds } } })
    if (req.user!.role === 'TEACHER' && exams.some(e => e.status === 'PUBLISHED')) {
      res.status(403).json({ success: false, message: 'Results have been published — marks are now read-only' })
      return
    }

    for (const e of entries) {
      if (e.marksObtained < 0) { res.status(400).json({ success: false, message: 'Marks cannot be negative' }); return }
      if (e.marksObtained > e.maximumMarks) { res.status(400).json({ success: false, message: 'Marks cannot exceed maximum marks' }); return }
      if (req.user!.role === 'TEACHER') {
        const owns = await teacherOwnsStudent(req.user!.userId, e.studentId)
        if (!owns) { res.status(403).json({ success: false, message: 'You can only enter marks for your own students' }); return }
      }
    }

    const results = await Promise.all(entries.map(e => {
      const grade = calcGrade(e.marksObtained, e.maximumMarks)
      return prisma.mark.upsert({
        where: { studentId_subjectId_examId: { studentId: e.studentId, subjectId: e.subjectId, examId: e.examId } },
        update: { marksObtained: e.marksObtained, maximumMarks: e.maximumMarks, grade, remarks: e.remarks || null, enteredBy: req.user!.userId },
        create: { studentId: e.studentId, className: e.className, section: e.section, subjectId: e.subjectId, examId: e.examId, marksObtained: e.marksObtained, maximumMarks: e.maximumMarks, grade, remarks: e.remarks || null, enteredBy: req.user!.userId },
        include: markInclude,
      })
    }))

    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Marks Entered', `${results.length} mark(s) saved`)
    res.json({ success: true, data: results })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// PUT /api/exam-marks/:id
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const id = parseInt(req.params.id)
    const existing = await prisma.mark.findUnique({ where: { id }, include: { exam: true } })
    if (!existing) { res.status(404).json({ success: false, message: 'Not found' }); return }

    if (req.user!.role === 'TEACHER') {
      if (existing.exam.status === 'PUBLISHED') { res.status(403).json({ success: false, message: 'Results have been published — marks are now read-only' }); return }
      const owns = await teacherOwnsStudent(req.user!.userId, existing.studentId)
      if (!owns) { res.status(403).json({ success: false, message: 'You can only edit marks for your own students' }); return }
    }

    const { marksObtained, maximumMarks, remarks } = req.body as { marksObtained: number; maximumMarks: number; remarks?: string }
    if (marksObtained < 0) { res.status(400).json({ success: false, message: 'Marks cannot be negative' }); return }
    if (marksObtained > maximumMarks) { res.status(400).json({ success: false, message: 'Marks cannot exceed maximum marks' }); return }

    const grade = calcGrade(marksObtained, maximumMarks)
    const mark = await prisma.mark.update({ where: { id }, data: { marksObtained, maximumMarks, grade, remarks: remarks ?? existing.remarks }, include: markInclude })
    res.json({ success: true, data: mark })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// DELETE /api/exam-marks/:id
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const id = parseInt(req.params.id)
    const existing = await prisma.mark.findUnique({ where: { id }, include: { exam: true } })
    if (!existing) { res.status(404).json({ success: false, message: 'Not found' }); return }

    if (req.user!.role === 'TEACHER') {
      if (existing.exam.status === 'PUBLISHED') { res.status(403).json({ success: false, message: 'Results have been published — marks are now read-only' }); return }
      const owns = await teacherOwnsStudent(req.user!.userId, existing.studentId)
      if (!owns) { res.status(403).json({ success: false, message: 'You can only delete marks for your own students' }); return }
    }

    await prisma.mark.delete({ where: { id } })
    res.json({ success: true, message: 'Deleted' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// GET /api/exam-marks/analysis?examId=
router.get('/meta/analysis', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'HEADMASTER') { res.status(403).json({ success: false, message: 'Headmaster access only' }); return }
    const { examId } = req.query as Record<string, string>
    const where: Record<string, unknown> = examId ? { examId: parseInt(examId) } : {}

    const marks = await prisma.mark.findMany({ where, include: markInclude })
    if (marks.length === 0) { res.json({ success: true, data: null }); return }

    const passCount = marks.filter(m => (m.marksObtained / m.maximumMarks) * 100 >= 35).length
    const schoolPassPct = Math.round((passCount / marks.length) * 100)
    const avgMarks = Math.round((marks.reduce((s, m) => s + (m.marksObtained / m.maximumMarks) * 100, 0) / marks.length) * 10) / 10

    const classKeys = [...new Set(marks.map(m => `${m.className}-${m.section}`))]
    const classWise = classKeys.map(key => {
      const items = marks.filter(m => `${m.className}-${m.section}` === key)
      const p = items.filter(m => (m.marksObtained / m.maximumMarks) * 100 >= 35).length
      return { className: key, passPercentage: Math.round((p / items.length) * 100), total: items.length }
    })

    const subjectKeys = [...new Set(marks.map(m => m.subjectId))]
    const subjectWise = subjectKeys.map(sid => {
      const items = marks.filter(m => m.subjectId === sid)
      const p = items.filter(m => (m.marksObtained / m.maximumMarks) * 100 >= 35).length
      return { subjectName: items[0].subject.subjectName, passPercentage: Math.round((p / items.length) * 100), average: Math.round((items.reduce((s, m) => s + (m.marksObtained / m.maximumMarks) * 100, 0) / items.length) * 10) / 10, total: items.length }
    })

    const byStudent = new Map<number, { name: string; roll: string; obtained: number; max: number }>()
    marks.forEach(m => {
      const cur = byStudent.get(m.studentId) || { name: m.student.fullName, roll: m.student.rollNumber, obtained: 0, max: 0 }
      cur.obtained += m.marksObtained
      cur.max += m.maximumMarks
      byStudent.set(m.studentId, cur)
    })
    const studentPct = [...byStudent.entries()].map(([id, v]) => ({ studentId: id, name: v.name, roll: v.roll, percentage: v.max > 0 ? Math.round((v.obtained / v.max) * 1000) / 10 : 0 }))
    const topScorers = [...studentPct].sort((a, b) => b.percentage - a.percentage).slice(0, 5)
    const lowestScorers = [...studentPct].sort((a, b) => a.percentage - b.percentage).slice(0, 5)

    res.json({ success: true, data: { schoolPassPct, avgMarks, classWise, subjectWise, topScorers, lowestScorers, totalMarks: marks.length } })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// GET /api/exam-marks/meta/report-card?studentId=&examId=
router.get('/meta/report-card', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, examId } = req.query as Record<string, string>
    if (!studentId || !examId) { res.status(400).json({ success: false, message: 'studentId and examId required' }); return }
    const sid = parseInt(studentId)
    const eid = parseInt(examId)

    if (req.user!.role === 'STUDENT' && req.user!.userId !== sid) { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    if (req.user!.role === 'TEACHER') {
      const owns = await teacherOwnsStudent(req.user!.userId, sid)
      if (!owns) { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    }

    const exam = await prisma.exam.findUnique({ where: { id: eid } })
    if (!exam) { res.status(404).json({ success: false, message: 'Exam not found' }); return }
    if (req.user!.role === 'STUDENT' && exam.status !== 'PUBLISHED') { res.status(403).json({ success: false, message: 'Results not yet published' }); return }

    const student = await prisma.student.findUnique({ where: { id: sid }, select: { fullName: true, admissionNumber: true, className: true, section: true, rollNumber: true } })
    if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return }

    const marks = await prisma.mark.findMany({ where: { studentId: sid, examId: eid }, include: { subject: true }, orderBy: { subject: { subjectName: 'asc' } } })
    if (marks.length === 0) { res.status(404).json({ success: false, message: 'No marks found for this exam' }); return }

    const school = await prisma.schoolProfile.findFirst()
    const obtained = marks.reduce((s, m) => s + m.marksObtained, 0)
    const max = marks.reduce((s, m) => s + m.maximumMarks, 0)
    const percentage = max > 0 ? Math.round((obtained / max) * 1000) / 10 : 0
    const result = marks.every(m => (m.marksObtained / m.maximumMarks) * 100 >= 35) ? 'PASS' : 'FAIL'

    res.json({
      success: true,
      data: {
        school: { schoolName: school?.schoolName || 'Govt Model Higher Secondary School', headmasterName: school?.headmasterName || '' },
        student,
        exam: { examName: exam.examName, examType: exam.examType, academicYear: exam.academicYear },
        subjects: marks.map(m => ({ subjectName: m.subject.subjectName, marksObtained: m.marksObtained, maximumMarks: m.maximumMarks, grade: m.grade })),
        totalObtained: obtained,
        grandTotal: max,
        percentage,
        grade: calcGrade(obtained, max),
        result,
      },
    })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
