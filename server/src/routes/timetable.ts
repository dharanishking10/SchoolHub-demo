import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/timetable?className=&section=
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { className, section } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}

    if (req.user!.role === 'TEACHER') {
      where.teacherId = req.user!.userId
    } else if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { id: req.user!.userId }, select: { className: true, section: true } })
      if (student) { where.className = student.className; where.section = student.section }
    } else {
      if (className) where.className = className
      if (section) where.section = section
    }

    const entries = await prisma.timetable.findMany({
      where,
      include: { teacher: { select: { fullName: true, subject: true } } },
      orderBy: [{ day: 'asc' }, { period: 'asc' }],
    })
    res.json({ success: true, data: entries })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/timetable — HEADMASTER only
router.post('/', verifyToken, requireRole('HEADMASTER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teacherId, className, section, day, period, subject, startTime, endTime } = req.body
    await prisma.timetable.upsert({
      where: { className_section_day_period: { className, section, day, period } },
      update: { teacherId, subject, startTime, endTime },
      create: { teacherId, className, section, day, period, subject, startTime, endTime },
    })
    res.json({ success: true })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
