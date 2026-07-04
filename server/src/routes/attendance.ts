import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/attendance?className=&section=&date= (teacher gets class attendance, student gets own)
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { className, section, date, studentId } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}

    if (req.user!.role === 'STUDENT') {
      where.studentId = req.user!.userId
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

// GET /api/attendance/summary?studentId= (student gets own, teacher gets any)
router.get('/summary', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sid = req.user!.role === 'STUDENT' ? req.user!.userId : parseInt((req.query.studentId as string) || '0')
    if (!sid) { res.status(400).json({ success: false, message: 'studentId required' }); return }

    const all = await prisma.attendance.count({ where: { studentId: sid } })
    const present = await prisma.attendance.count({ where: { studentId: sid, status: 'PRESENT' } })
    const absent = await prisma.attendance.count({ where: { studentId: sid, status: 'ABSENT' } })
    const late = await prisma.attendance.count({ where: { studentId: sid, status: 'LATE' } })
    const recent = await prisma.attendance.findMany({ where: { studentId: sid }, orderBy: { date: 'desc' }, take: 30 })

    res.json({ success: true, data: { total: all, present, absent, late, percentage: all > 0 ? Math.round((present / all) * 100) : 0, recent } })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/attendance — bulk mark (teacher)
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const { date, className, section, records } = req.body as { date: string; className: string; section: string; records: { studentId: number; status: string }[] }
    if (!date || !className || !section || !records?.length) { res.status(400).json({ success: false, message: 'date, className, section, records required' }); return }

    const results = await Promise.all(records.map(r =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId: r.studentId, date } },
        update: { status: r.status, markedBy: req.user!.userId },
        create: { studentId: r.studentId, date, status: r.status, className, section, markedBy: req.user!.userId },
      })
    ))
    res.json({ success: true, data: results })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
