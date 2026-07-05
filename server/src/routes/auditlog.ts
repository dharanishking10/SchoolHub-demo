import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/audit-log (Headmaster only)
router.get('/', verifyToken, requireRole('HEADMASTER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action = '', role = '', page = '1', limit = '25' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: Record<string, unknown> = {}
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (role) where.userRole = role

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.count({ where }),
    ])
    res.json({ success: true, data: { logs, total, page: parseInt(page), limit: parseInt(limit) } })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
