import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.get('/stats', verifyToken, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [teachers, students, classes, activities, activeTeachers, boys, girls, byClass, recentAdmissions] = await Promise.all([
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.schoolClass.count(),
      prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
      prisma.teacher.count({ where: { status: 'ACTIVE' } }),
      prisma.student.count({ where: { gender: 'MALE' } }),
      prisma.student.count({ where: { gender: 'FEMALE' } }),
      prisma.student.groupBy({ by: ['className'], _count: { id: true }, orderBy: { className: 'asc' } }),
      prisma.student.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, admissionNumber: true, fullName: true, className: true, section: true, gender: true, createdAt: true } }),
    ])
    res.json({ success: true, data: { teachers, activeTeachers, students, boys, girls, classes, activities, classData: byClass.map(c => ({ className: c.className, count: c._count.id })), recentAdmissions } })
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
