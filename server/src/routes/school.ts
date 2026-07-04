import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.get('/', verifyToken, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.schoolProfile.findFirst()
    res.json({ success: true, data: { profile } })
  } catch {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.put('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { schoolName, schoolCode, district, block, academicYear, headmasterName } = req.body
    const existing = await prisma.schoolProfile.findFirst()
    const profile = existing
      ? await prisma.schoolProfile.update({ where: { id: existing.id }, data: { schoolName, schoolCode, district, block, academicYear, headmasterName } })
      : await prisma.schoolProfile.create({ data: { schoolName, schoolCode, district, block, academicYear, headmasterName } })
    await prisma.activity.create({ data: { type: 'profile', message: 'School profile updated' } })
    res.json({ success: true, data: { profile } })
  } catch {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router
