import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { audit } from '../utils/activityLog'

const router = Router()
const prisma = new PrismaClient()

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '8:00', end: '8:45' },
  2: { start: '8:45', end: '9:30' },
  3: { start: '9:45', end: '10:30' },
  4: { start: '10:30', end: '11:15' },
  5: { start: '11:30', end: '12:15' },
  6: { start: '12:15', end: '1:00' },
}

// GET /api/timetable — role-aware
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { className, section, teacherId: qTeacherId } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}

    if (req.user!.role === 'TEACHER') {
      where.teacherId = req.user!.userId
    } else if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { id: req.user!.userId },
        select: { className: true, section: true },
      })
      if (!student) { res.status(403).json({ success: false, message: 'Student record not found' }); return }
      where.className = student.className
      where.section = student.section
    } else {
      // HEADMASTER — optional filters
      if (qTeacherId) where.teacherId = parseInt(qTeacherId)
      if (className) where.className = className
      if (section) where.section = section
    }

    const entries = await prisma.timetable.findMany({
      where,
      include: { teacher: { select: { id: true, fullName: true, subject: true, employeeId: true } } },
      orderBy: [{ day: 'asc' }, { period: 'asc' }],
    })
    res.json({ success: true, data: entries })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/timetable — TEACHER (own entries) or HEADMASTER (any)
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user!.role
    if (role !== 'TEACHER' && role !== 'HEADMASTER') {
      res.status(403).json({ success: false, message: 'Not authorized' }); return
    }

    let { teacherId, className, section, day, period, subject, roomNumber } = req.body

    // Teacher can only create entries for themselves
    if (role === 'TEACHER') teacherId = req.user!.userId
    teacherId = parseInt(teacherId)
    period = parseInt(period)

    if (!teacherId || !className || !section || !day || period < 1 || period > 6 || !subject) {
      res.status(400).json({ success: false, message: 'All fields (except room) are required; period must be 1–6' }); return
    }

    // Validate teacher exists
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } })
    if (!teacher) { res.status(404).json({ success: false, message: 'Teacher not found' }); return }

    // Check: teacher already has a class at this period on this day
    const teacherConflict = await prisma.timetable.findFirst({ where: { teacherId, day, period } })
    if (teacherConflict) {
      res.status(409).json({ success: false, message: `${teacher.fullName} already has Period ${period} on ${day} (${teacherConflict.className}-${teacherConflict.section})` }); return
    }

    // Check: class+section already has a subject at this period on this day
    const classConflict = await prisma.timetable.findFirst({ where: { className, section, day, period } })
    if (classConflict) {
      res.status(409).json({ success: false, message: `${className}-${section} already has ${classConflict.subject} at Period ${period} on ${day}` }); return
    }

    const times = PERIOD_TIMES[period] || { start: '', end: '' }
    const entry = await prisma.timetable.create({
      data: { teacherId, className, section, day, period, subject, roomNumber: roomNumber || '', startTime: times.start, endTime: times.end },
      include: { teacher: { select: { id: true, fullName: true, subject: true, employeeId: true } } },
    })
    await audit(req.user!.userId, req.user!.name || 'User', role, 'Timetable Entry Added', `${day} P${period}: ${className}-${section} ${subject}`)
    res.json({ success: true, data: entry })
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e.code === 'P2002') { res.status(409).json({ success: false, message: 'A conflict exists for this period slot' }); return }
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/timetable/:id — TEACHER (own) or HEADMASTER (any)
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user!.role
    if (role !== 'TEACHER' && role !== 'HEADMASTER') {
      res.status(403).json({ success: false, message: 'Not authorized' }); return
    }

    const id = parseInt(req.params.id)
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid ID' }); return }

    const existing = await prisma.timetable.findUnique({ where: { id } })
    if (!existing) { res.status(404).json({ success: false, message: 'Entry not found' }); return }

    if (role === 'TEACHER' && existing.teacherId !== req.user!.userId) {
      res.status(403).json({ success: false, message: 'You can only edit your own timetable' }); return
    }

    let { teacherId, className, section, day, period, subject, roomNumber } = req.body
    period = parseInt(period)
    teacherId = role === 'TEACHER' ? req.user!.userId : parseInt(teacherId ?? existing.teacherId)

    if (!className || !section || !day || period < 1 || period > 6 || !subject) {
      res.status(400).json({ success: false, message: 'All fields (except room) are required; period must be 1–6' }); return
    }

    // Check teacher conflict excluding this entry
    const teacherConflict = await prisma.timetable.findFirst({ where: { teacherId, day, period, NOT: { id } } })
    if (teacherConflict) {
      res.status(409).json({ success: false, message: `Teacher already has Period ${period} on ${day} for ${teacherConflict.className}-${teacherConflict.section}` }); return
    }

    // Check class conflict excluding this entry
    const classConflict = await prisma.timetable.findFirst({ where: { className, section, day, period, NOT: { id } } })
    if (classConflict) {
      res.status(409).json({ success: false, message: `${className}-${section} already has ${classConflict.subject} at Period ${period} on ${day}` }); return
    }

    const times = PERIOD_TIMES[period] || { start: existing.startTime, end: existing.endTime }
    const entry = await prisma.timetable.update({
      where: { id },
      data: { teacherId, className, section, day, period, subject, roomNumber: roomNumber || '', startTime: times.start, endTime: times.end },
      include: { teacher: { select: { id: true, fullName: true, subject: true, employeeId: true } } },
    })
    await audit(req.user!.userId, req.user!.name || 'User', role, 'Timetable Entry Updated', `${day} P${period}: ${className}-${section} ${subject}`)
    res.json({ success: true, data: entry })
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e.code === 'P2002') { res.status(409).json({ success: false, message: 'A conflict exists for this period slot' }); return }
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// DELETE /api/timetable/:id — TEACHER (own) or HEADMASTER (any)
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user!.role
    if (role !== 'TEACHER' && role !== 'HEADMASTER') {
      res.status(403).json({ success: false, message: 'Not authorized' }); return
    }

    const id = parseInt(req.params.id)
    if (isNaN(id)) { res.status(400).json({ success: false, message: 'Invalid ID' }); return }

    const existing = await prisma.timetable.findUnique({ where: { id } })
    if (!existing) { res.status(404).json({ success: false, message: 'Entry not found' }); return }

    if (role === 'TEACHER' && existing.teacherId !== req.user!.userId) {
      res.status(403).json({ success: false, message: 'You can only delete your own timetable entries' }); return
    }

    await prisma.timetable.delete({ where: { id } })
    await audit(req.user!.userId, req.user!.name || 'User', role, 'Timetable Entry Deleted', `${existing.day} P${existing.period}: ${existing.className}-${existing.section}`)
    res.json({ success: true, message: 'Entry deleted' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
