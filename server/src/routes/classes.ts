import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

router.get('/', verifyToken, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classes = await prisma.schoolClass.findMany({ orderBy: [{ name: 'asc' }, { section: 'asc' }] })
    res.json({ success: true, data: { classes } })
  } catch {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router
