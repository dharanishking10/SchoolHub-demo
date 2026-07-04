import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.get('/', verifyToken, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [total, boys, girls, byClass] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { gender: 'MALE' } }),
      prisma.student.count({ where: { gender: 'FEMALE' } }),
      prisma.student.groupBy({ by: ['className'], _count: { id: true }, orderBy: { className: 'asc' } }),
    ])
    const classData = byClass.map(c => ({ className: c.className, count: c._count.id }))
    const attendance = [82, 88, 91, 85, 79, 93, 87, 90, 84, 88, 76, 92]
    const months = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May']
    res.json({ success: true, data: { total, boys, girls, classData, attendance: months.map((m, i) => ({ month: m, pct: attendance[i] })) } })
  } catch {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router
