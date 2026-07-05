import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/notifications
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { recipientId: req.user!.userId, recipientRole: req.user!.role },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const unreadCount = await prisma.notification.count({ where: { recipientId: req.user!.userId, recipientRole: req.user!.role, isRead: false } })
    res.json({ success: true, data: { notifications, unreadCount } })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// PUT /api/notifications/:id/read
router.put('/:id/read', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const notif = await prisma.notification.findUnique({ where: { id } })
    if (!notif || notif.recipientId !== req.user!.userId || notif.recipientRole !== req.user!.role) { res.status(404).json({ success: false, message: 'Not found' }); return }
    await prisma.notification.update({ where: { id }, data: { isRead: true } })
    res.json({ success: true })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// PUT /api/notifications/read-all
router.put('/read-all', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({ where: { recipientId: req.user!.userId, recipientRole: req.user!.role, isRead: false }, data: { isRead: true } })
    res.json({ success: true })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// DELETE /api/notifications/:id
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const notif = await prisma.notification.findUnique({ where: { id } })
    if (!notif || notif.recipientId !== req.user!.userId || notif.recipientRole !== req.user!.role) { res.status(404).json({ success: false, message: 'Not found' }); return }
    await prisma.notification.delete({ where: { id } })
    res.json({ success: true })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
