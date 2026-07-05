import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { notify, audit } from '../utils/activityLog'

const router = Router()
const prisma = new PrismaClient()

async function teacherOwnsStudent(teacherId: number, studentId: number): Promise<boolean> {
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { createdByTeacherId: true } })
  return student?.createdByTeacherId === teacherId
}

// GET /api/attendance
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { className, section, date, studentId } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}

    if (req.user!.role === 'STUDENT') {
      where.studentId = req.user!.userId
    } else if (req.user!.role === 'TEACHER') {
      // Teacher only sees their own students' attendance
      where.student = { createdByTeacherId: req.user!.userId }
      if (className) where.className = className
      if (section) where.section = section
      if (studentId) {
        const owns = await teacherOwnsStudent(req.user!.userId, parseInt(studentId))
        if (!owns) { res.status(403).json({ success: false, message: 'Not your student' }); return }
        where.studentId = parseInt(studentId)
        delete where.student
      }
    } else {
      if (className) where.className = className
      if (section) where.section = section
      if (studentId) where.studentId = parseInt(studentId)
    }
    if (date) where.date = date

    const records = await prisma.attendance.findMany({
      where,
      include: { student: { select: { id: true, fullName: true, rollNumber: true, gender: true } } },
      orderBy: [{ date: 'desc' }, { student: { rollNumber: 'asc' } }],
    })
    res.json({ success: true, data: records })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// GET /api/attendance/summary
router.get('/summary', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sid = req.user!.role === 'STUDENT' ? req.user!.userId : parseInt((req.query.studentId as string) || '0')
    if (!sid) { res.status(400).json({ success: false, message: 'studentId required' }); return }

    if (req.user!.role === 'TEACHER') {
      const owns = await teacherOwnsStudent(req.user!.userId, sid)
      if (!owns) { res.status(403).json({ success: false, message: 'Not your student' }); return }
    }

    const all = await prisma.attendance.count({ where: { studentId: sid } })
    const present = await prisma.attendance.count({ where: { studentId: sid, status: 'PRESENT' } })
    const absent = await prisma.attendance.count({ where: { studentId: sid, status: 'ABSENT' } })
    const late = await prisma.attendance.count({ where: { studentId: sid, status: 'LATE' } })
    const leave = await prisma.attendance.count({ where: { studentId: sid, status: 'LEAVE' } })
    const recent = await prisma.attendance.findMany({ where: { studentId: sid }, orderBy: { date: 'desc' }, take: 60 })
    const today = new Date().toISOString().split('T')[0]
    const todayRecord = recent.find(r => r.date === today)

    res.json({ success: true, data: { total: all, present, absent, late, leave, percentage: all > 0 ? Math.round((present / all) * 100) : 0, recent, today: todayRecord?.status || null } })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

const VALID_STATUSES = ['PRESENT', 'ABSENT', 'LEAVE', 'LATE']

// POST /api/attendance — bulk mark
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const { date, className, section, records } = req.body as { date: string; className: string; section: string; records: { studentId: number; status: string }[] }
    if (!date || !className || !section || !records?.length) { res.status(400).json({ success: false, message: 'date, className, section, records required' }); return }

    const today = new Date().toISOString().split('T')[0]
    if (req.user!.role === 'TEACHER' && date !== today) {
      res.status(403).json({ success: false, message: "Teachers can only mark today's attendance. Contact the Headmaster to edit past records." })
      return
    }

    // Teacher ownership check for all students in the batch
    if (req.user!.role === 'TEACHER') {
      for (const r of records) {
        const owns = await teacherOwnsStudent(req.user!.userId, r.studentId)
        if (!owns) {
          res.status(403).json({ success: false, message: `Student #${r.studentId} does not belong to you` })
          return
        }
      }
    }

    const invalid = records.find(r => !r.studentId || !VALID_STATUSES.includes(r.status))
    if (invalid) { res.status(400).json({ success: false, message: 'Every student must have a valid status (Present, Absent, Leave, Late)' }); return }

    const results = await Promise.all(records.map(r =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId: r.studentId, date } },
        update: { status: r.status, markedBy: req.user!.userId },
        create: { studentId: r.studentId, date, status: r.status, className, section, markedBy: req.user!.userId },
      })
    ))

    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Attendance Submitted', `${className}-${section} on ${date} (${records.length} students)`)

    const headmasters = await prisma.user.findMany({ where: { role: 'HEADMASTER' }, select: { id: true } })
    await Promise.all(headmasters.map(h => notify(h.id, 'HEADMASTER', 'attendance', 'Attendance Submitted', `Attendance for Std ${className}-${section} submitted for ${date} by ${req.user!.name || 'Teacher'}`)))

    const absentees = records.filter(r => r.status === 'ABSENT')
    await Promise.all(absentees.map(r => notify(r.studentId, 'STUDENT', 'attendance_warning', 'Marked Absent', `You were marked absent on ${date}.`)))

    res.json({ success: true, data: results })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// GET /api/attendance/reports — HEADMASTER only
router.get('/reports', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'HEADMASTER') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const { className, section, month } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}
    if (className) where.className = className
    if (section) where.section = section
    if (month) where.date = { startsWith: month }

    const records = await prisma.attendance.findMany({
      where,
      include: { student: { select: { id: true, fullName: true, rollNumber: true, className: true, section: true } } },
      orderBy: [{ date: 'desc' }],
    })

    const byClass: Record<string, { present: number; absent: number; leave: number; late: number; total: number }> = {}
    const byStudent: Record<number, { name: string; rollNumber: string; present: number; absent: number; leave: number; late: number; total: number }> = {}

    for (const r of records) {
      const classKey = `${r.className}-${r.section}`
      byClass[classKey] = byClass[classKey] || { present: 0, absent: 0, leave: 0, late: 0, total: 0 }
      byClass[classKey].total++
      byClass[classKey][r.status.toLowerCase() as 'present' | 'absent' | 'leave' | 'late']++

      byStudent[r.studentId] = byStudent[r.studentId] || { name: r.student.fullName, rollNumber: r.student.rollNumber, present: 0, absent: 0, leave: 0, late: 0, total: 0 }
      byStudent[r.studentId].total++
      byStudent[r.studentId][r.status.toLowerCase() as 'present' | 'absent' | 'leave' | 'late']++
    }

    res.json({ success: true, data: { records, byClass, byStudent } })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
