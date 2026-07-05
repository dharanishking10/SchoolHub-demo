import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { notifyClass, audit } from '../utils/activityLog'

const router = Router()
const prisma = new PrismaClient()

// GET /api/homework?className=&section=&teacherId=
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { className, section, status } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}

    if (req.user!.role === 'TEACHER') {
      where.teacherId = req.user!.userId
    } else if (req.user!.role === 'STUDENT') {
      // Student sees homework for their class
      const student = await prisma.student.findUnique({ where: { id: req.user!.userId }, select: { className: true, section: true } })
      if (student) { where.className = student.className; where.section = student.section }
    }
    if (className && req.user!.role !== 'STUDENT') where.className = className
    if (section && req.user!.role !== 'STUDENT') where.section = section
    if (status) where.status = status

    const hw = await prisma.homework.findMany({
      where,
      include: { teacher: { select: { fullName: true, subject: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: hw })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/homework
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'TEACHER' && req.user!.role !== 'HEADMASTER') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const { className, section, subject, title, description, dueDate } = req.body
    if (!className || !section || !subject || !title || !dueDate) { res.status(400).json({ success: false, message: 'Required fields missing' }); return }
    const teacherId = req.user!.role === 'TEACHER' ? req.user!.userId : 1
    const hw = await prisma.homework.create({ data: { teacherId, className, section, subject, title, description: description || null, dueDate, status: 'ACTIVE' } })
    await notifyClass(className, section, 'homework', 'New Homework', `${subject}: ${title} (Due ${dueDate})`)
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Homework Created', `${subject} - ${title} for ${className}-${section}`)
    res.json({ success: true, data: hw })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// PUT /api/homework/:id
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const { title, description, dueDate, status } = req.body
    const hw = await prisma.homework.update({ where: { id: parseInt(req.params.id) }, data: { title, description: description || null, dueDate, status } })
    res.json({ success: true, data: hw })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// DELETE /api/homework/:id
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    await prisma.homework.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true, message: 'Deleted' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
