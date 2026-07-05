import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/search?q=
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || '').trim()
    if (!q || q.length < 2) { res.json({ success: true, data: { students: [], teachers: [], attendance: [], homework: [], marks: [], announcements: [] } }); return }
    const role = req.user!.role

    const results: {
      students: unknown[]; teachers: unknown[]; attendance: unknown[]; homework: unknown[]; marks: unknown[]; announcements: unknown[]
    } = { students: [], teachers: [], attendance: [], homework: [], marks: [], announcements: [] }

    if (role === 'HEADMASTER' || role === 'TEACHER') {
      results.students = await prisma.student.findMany({
        where: { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { admissionNumber: { contains: q, mode: 'insensitive' } }, { rollNumber: { contains: q, mode: 'insensitive' } }] },
        select: { id: true, fullName: true, admissionNumber: true, rollNumber: true, className: true, section: true },
        take: 8,
      })
      results.homework = await prisma.homework.findMany({
        where: { OR: [{ title: { contains: q, mode: 'insensitive' } }, { subject: { contains: q, mode: 'insensitive' } }], ...(role === 'TEACHER' ? { teacherId: req.user!.userId } : {}) },
        select: { id: true, title: true, subject: true, className: true, section: true, dueDate: true },
        take: 8,
      })
    }
    if (role === 'HEADMASTER') {
      results.teachers = await prisma.teacher.findMany({
        where: { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { employeeId: { contains: q, mode: 'insensitive' } }, { subject: { contains: q, mode: 'insensitive' } }] },
        select: { id: true, fullName: true, employeeId: true, subject: true },
        take: 8,
      })
    }
    if (role === 'STUDENT') {
      const sid = req.user!.userId
      results.marks = await prisma.marks.findMany({ where: { studentId: sid, subject: { contains: q, mode: 'insensitive' } }, take: 8 })
      results.homework = await prisma.homework.findMany({ where: { title: { contains: q, mode: 'insensitive' } }, select: { id: true, title: true, subject: true, dueDate: true }, take: 8 })
    } else {
      results.marks = await prisma.marks.findMany({
        where: { subject: { contains: q, mode: 'insensitive' } },
        include: { student: { select: { fullName: true, rollNumber: true } } },
        take: 8,
      })
    }
    results.announcements = await prisma.announcement.findMany({
      where: { status: 'PUBLISHED', OR: [{ title: { contains: q, mode: 'insensitive' } }, { message: { contains: q, mode: 'insensitive' } }] },
      take: 8,
    })

    res.json({ success: true, data: results })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
