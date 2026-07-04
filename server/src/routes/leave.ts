import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/leave?status=
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}
    if (req.user!.role === 'STUDENT') where.studentId = req.user!.userId
    if (status) where.status = status

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: { student: { select: { id: true, fullName: true, rollNumber: true, className: true, section: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: requests })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/leave (student applies)
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'STUDENT') { res.status(403).json({ success: false, message: 'Only students can apply' }); return }
    const { fromDate, toDate, reason } = req.body
    if (!fromDate || !toDate || !reason) { res.status(400).json({ success: false, message: 'All fields required' }); return }
    const request = await prisma.leaveRequest.create({ data: { studentId: req.user!.userId, fromDate, toDate, reason } })
    res.json({ success: true, data: request })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// PUT /api/leave/:id (teacher approves/rejects)
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const { status, teacherComment } = req.body
    const updated = await prisma.leaveRequest.update({
      where: { id: parseInt(req.params.id) },
      data: { status, teacherComment: teacherComment || null, reviewedBy: req.user!.userId },
    })
    res.json({ success: true, data: updated })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// DELETE /api/leave/:id (student cancels pending)
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const req_ = await prisma.leaveRequest.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!req_) { res.status(404).json({ success: false, message: 'Not found' }); return }
    if (req.user!.role === 'STUDENT' && req_.studentId !== req.user!.userId) { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    if (req_.status !== 'PENDING') { res.status(400).json({ success: false, message: 'Cannot cancel processed request' }); return }
    await prisma.leaveRequest.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true, message: 'Leave request cancelled' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
