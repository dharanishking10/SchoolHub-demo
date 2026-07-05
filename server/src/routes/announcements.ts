import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { notifyAllOfRole, notifyClass, audit } from '../utils/activityLog'

const router = Router()
const prisma = new PrismaClient()

// GET /api/announcements
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = req.user!.role
    let where: Record<string, unknown> = { status: 'PUBLISHED' }

    if (role === 'STUDENT') {
      const student = await prisma.student.findUnique({ where: { id: req.user!.userId }, select: { className: true, section: true } })
      where = {
        status: 'PUBLISHED',
        OR: [
          { audience: 'ALL' },
          { audience: 'STUDENTS' },
          { audience: 'CLASS', className: student?.className, section: student?.section },
        ],
      }
    } else if (role === 'TEACHER') {
      where = { status: 'PUBLISHED', OR: [{ audience: 'ALL' }, { audience: 'TEACHERS' }, { createdById: req.user!.userId, createdByRole: 'TEACHER' }] }
    }

    const announcements = await prisma.announcement.findMany({ where, orderBy: { createdAt: 'desc' } })
    res.json({ success: true, data: announcements })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/announcements
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Students cannot create announcements' }); return }
    const { title, message, audience, className, section, scheduledAt } = req.body as {
      title: string; message: string; audience: string; className?: string; section?: string; scheduledAt?: string
    }
    if (!title || !message || !audience) { res.status(400).json({ success: false, message: 'title, message, audience required' }); return }

    let finalAudience = audience
    if (req.user!.role === 'TEACHER') {
      if (!className || !section) { res.status(400).json({ success: false, message: 'Teachers must specify class and section' }); return }
      finalAudience = 'CLASS'
    }

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date()
    const announcement = await prisma.announcement.create({
      data: {
        title, message, audience: finalAudience,
        className: finalAudience === 'CLASS' ? className : null,
        section: finalAudience === 'CLASS' ? section : null,
        createdById: req.user!.userId, createdByRole: req.user!.role, createdByName: req.user!.name || 'User',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: isScheduled ? 'SCHEDULED' : 'PUBLISHED',
      },
    })

    if (!isScheduled) {
      if (finalAudience === 'ALL') {
        await Promise.all([notifyAllOfRole('TEACHER', 'announcement', title, message), notifyAllOfRole('STUDENT', 'announcement', title, message), notifyAllOfRole('HEADMASTER', 'announcement', title, message)])
      } else if (finalAudience === 'TEACHERS') {
        await notifyAllOfRole('TEACHER', 'announcement', title, message)
      } else if (finalAudience === 'STUDENTS') {
        await notifyAllOfRole('STUDENT', 'announcement', title, message)
      } else if (finalAudience === 'CLASS' && className && section) {
        await notifyClass(className, section, 'announcement', title, message)
      }
    }
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Announcement Created', title)
    res.json({ success: true, data: announcement })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// PUT /api/announcements/:id
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const id = parseInt(req.params.id)
    const existing = await prisma.announcement.findUnique({ where: { id } })
    if (!existing) { res.status(404).json({ success: false, message: 'Not found' }); return }
    if (req.user!.role === 'TEACHER' && existing.createdById !== req.user!.userId) { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const { title, message, scheduledAt } = req.body
    const updated = await prisma.announcement.update({ where: { id }, data: { title, message, scheduledAt: scheduledAt ? new Date(scheduledAt) : existing.scheduledAt } })
    res.json({ success: true, data: updated })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// DELETE /api/announcements/:id
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const id = parseInt(req.params.id)
    const existing = await prisma.announcement.findUnique({ where: { id } })
    if (!existing) { res.status(404).json({ success: false, message: 'Not found' }); return }
    if (req.user!.role === 'TEACHER' && existing.createdById !== req.user!.userId) { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    await prisma.announcement.delete({ where: { id } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Announcement Deleted', existing.title)
    res.json({ success: true, message: 'Announcement deleted' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
