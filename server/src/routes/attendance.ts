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

const VALID_STATUSES = ['PRESENT', 'ABSENT', 'LEAVE', 'LATE', 'HALF_DAY']

// GET /api/attendance/today-stats — HM dashboard summary for today
router.get('/today-stats', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const where: Record<string, unknown> = { date: today }
    if (req.user!.role === 'TEACHER') {
      where.student = { createdByTeacherId: req.user!.userId }
    }

    const [total, present, absent, late, halfDay, leave] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.count({ where: { ...where, status: 'PRESENT' } }),
      prisma.attendance.count({ where: { ...where, status: 'ABSENT' } }),
      prisma.attendance.count({ where: { ...where, status: 'LATE' } }),
      prisma.attendance.count({ where: { ...where, status: 'HALF_DAY' } }),
      prisma.attendance.count({ where: { ...where, status: 'LEAVE' } }),
    ])
    const percentage = total > 0 ? Math.round(((present + halfDay * 0.5) / total) * 100) : 0
    res.json({ success: true, data: { date: today, total, present, absent, late, halfDay, leave, percentage } })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// GET /api/attendance/summary — per-student summary
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
    const halfDay = await prisma.attendance.count({ where: { studentId: sid, status: 'HALF_DAY' } })
    const recent = await prisma.attendance.findMany({ where: { studentId: sid }, orderBy: { date: 'desc' }, take: 60 })
    const today = new Date().toISOString().split('T')[0]
    const todayRecord = recent.find(r => r.date === today)
    const effective = all > 0 ? Math.round(((present + halfDay * 0.5) / all) * 100) : 0

    res.json({ success: true, data: { total: all, present, absent, late, leave, halfDay, percentage: effective, recent, today: todayRecord?.status || null } })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// GET /api/attendance/reports — HM only
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

    const byClass: Record<string, { present: number; absent: number; leave: number; late: number; halfDay: number; total: number }> = {}
    const byStudent: Record<number, { name: string; rollNumber: string; present: number; absent: number; leave: number; late: number; halfDay: number; total: number }> = {}
    const byDate: Record<string, { present: number; absent: number; late: number; halfDay: number; total: number }> = {}

    for (const r of records) {
      const classKey = `${r.className}-${r.section}`
      byClass[classKey] = byClass[classKey] || { present: 0, absent: 0, leave: 0, late: 0, halfDay: 0, total: 0 }
      byClass[classKey].total++
      if (r.status === 'PRESENT') byClass[classKey].present++
      else if (r.status === 'ABSENT') byClass[classKey].absent++
      else if (r.status === 'LEAVE') byClass[classKey].leave++
      else if (r.status === 'LATE') byClass[classKey].late++
      else if (r.status === 'HALF_DAY') byClass[classKey].halfDay++

      byStudent[r.studentId] = byStudent[r.studentId] || { name: r.student.fullName, rollNumber: r.student.rollNumber, present: 0, absent: 0, leave: 0, late: 0, halfDay: 0, total: 0 }
      byStudent[r.studentId].total++
      if (r.status === 'PRESENT') byStudent[r.studentId].present++
      else if (r.status === 'ABSENT') byStudent[r.studentId].absent++
      else if (r.status === 'LEAVE') byStudent[r.studentId].leave++
      else if (r.status === 'LATE') byStudent[r.studentId].late++
      else if (r.status === 'HALF_DAY') byStudent[r.studentId].halfDay++

      byDate[r.date] = byDate[r.date] || { present: 0, absent: 0, late: 0, halfDay: 0, total: 0 }
      byDate[r.date].total++
      if (r.status === 'PRESENT') byDate[r.date].present++
      else if (r.status === 'ABSENT') byDate[r.date].absent++
      else if (r.status === 'LATE') byDate[r.date].late++
      else if (r.status === 'HALF_DAY') byDate[r.date].halfDay++
    }

    res.json({ success: true, data: { records, byClass, byStudent, byDate } })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// GET /api/attendance
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { className, section, date, studentId } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}

    if (req.user!.role === 'STUDENT') {
      where.studentId = req.user!.userId
    } else if (req.user!.role === 'TEACHER') {
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

// POST /api/attendance — bulk mark/upsert
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const { date, className, section, records } = req.body as { date: string; className: string; section: string; records: { studentId: number; status: string }[] }
    if (!date || !className || !section || !records?.length) { res.status(400).json({ success: false, message: 'date, className, section, records required' }); return }

    const todayStr = new Date().toISOString().split('T')[0]
    if (req.user!.role === 'TEACHER' && date !== todayStr) {
      res.status(403).json({ success: false, message: "Teachers can only mark today's attendance. Contact the Headmaster to edit past records." })
      return
    }

    if (req.user!.role === 'TEACHER') {
      for (const r of records) {
        const owns = await teacherOwnsStudent(req.user!.userId, r.studentId)
        if (!owns) { res.status(403).json({ success: false, message: `Student #${r.studentId} does not belong to you` }); return }
      }
    }

    const invalid = records.find(r => !r.studentId || !VALID_STATUSES.includes(r.status))
    if (invalid) { res.status(400).json({ success: false, message: 'Every student must have a valid status' }); return }

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

export default router
