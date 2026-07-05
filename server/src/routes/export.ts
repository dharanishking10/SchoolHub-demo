import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(',')]
  for (const row of rows) lines.push(headers.map(h => escape(row[h])).join(','))
  return lines.join('\n')
}

function sendCsv(res: Response, filename: string, rows: Record<string, unknown>[]) {
  const csv = toCsv(rows)
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(csv)
}

// GET /api/export/teachers
router.get('/teachers', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'HEADMASTER') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
  const teachers = await prisma.teacher.findMany({ select: { fullName: true, employeeId: true, mobile: true, email: true, subject: true, status: true } })
  sendCsv(res, 'teachers.csv', teachers)
})

// GET /api/export/students
router.get('/students', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
  const students = await prisma.student.findMany({ select: { admissionNumber: true, fullName: true, gender: true, className: true, section: true, rollNumber: true, status: true } })
  sendCsv(res, 'students.csv', students)
})

// GET /api/export/attendance?className=&section=&date=
router.get('/attendance', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
  const { className, section, date } = req.query as Record<string, string>
  const where: Record<string, unknown> = {}
  if (className) where.className = className
  if (section) where.section = section
  if (date) where.date = date
  const records = await prisma.attendance.findMany({ where, include: { student: { select: { fullName: true, rollNumber: true } } }, orderBy: { date: 'desc' } })
  sendCsv(res, 'attendance.csv', records.map(r => ({ date: r.date, rollNumber: r.student.rollNumber, name: r.student.fullName, className: r.className, section: r.section, status: r.status })))
})

// GET /api/export/marks
router.get('/marks', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
  const marks = await prisma.marks.findMany({ include: { student: { select: { fullName: true, rollNumber: true, className: true, section: true } } }, orderBy: { createdAt: 'desc' } })
  sendCsv(res, 'marks.csv', marks.map(m => ({ rollNumber: m.student.rollNumber, name: m.student.fullName, className: m.student.className, section: m.student.section, subject: m.subject, examName: m.examName, marksObtained: m.marksObtained, totalMarks: m.totalMarks, grade: m.grade })))
})

// GET /api/export/homework
router.get('/homework', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
  const where = req.user!.role === 'TEACHER' ? { teacherId: req.user!.userId } : {}
  const hw = await prisma.homework.findMany({ where, include: { teacher: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' } })
  sendCsv(res, 'homework.csv', hw.map(h => ({ title: h.title, subject: h.subject, className: h.className, section: h.section, teacher: h.teacher.fullName, dueDate: h.dueDate, status: h.status })))
})

// GET /api/export/reports (school-wide summary)
router.get('/reports', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== 'HEADMASTER') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
  const byClass = await prisma.student.groupBy({ by: ['className', 'section'], _count: { id: true }, orderBy: { className: 'asc' } })
  sendCsv(res, 'school-report.csv', byClass.map(c => ({ className: c.className, section: c.section, studentCount: c._count.id })))
})

export default router
