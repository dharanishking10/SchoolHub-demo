import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.get('/stats', verifyToken, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [teachers, students, classes, activities] = await Promise.all([
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.schoolClass.count(),
      prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ])
    const activeTeachers = await prisma.teacher.count({ where: { status: 'ACTIVE' } })
    const boys = await prisma.student.count({ where: { gender: 'MALE' } })
    const girls = await prisma.student.count({ where: { gender: 'FEMALE' } })
    res.json({ success: true, data: { teachers, activeTeachers, students, boys, girls, classes, activities } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router
