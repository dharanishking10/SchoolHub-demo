import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { notify, notifyAllOfRole, audit } from '../utils/activityLog'

const router = Router()
const prisma = new PrismaClient()

async function teacherOwnsStudent(teacherId: number, studentId: number): Promise<boolean> {
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { createdByTeacherId: true } })
  return student?.createdByTeacherId === teacherId
}

// GET /api/leave
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}

    if (req.user!.role === 'STUDENT') {
      where.studentId = req.user!.userId
    } else if (req.user!.role === 'TEACHER') {
      // Teacher only sees leave requests for their own students
      where.student = { createdByTeacherId: req.user!.userId }
    }
    // HEADMASTER sees all

    if (status) where.status = status

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: { student: { select: { id: true, fullName: true, rollNumber: true, className: true, section: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, data: requests })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/leave — student applies
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'STUDENT') { res.status(403).json({ success: false, message: 'Only students can apply' }); return }
    const { fromDate, toDate, reason } = req.body
    if (!fromDate || !toDate || !reason) { res.status(400).json({ success: false, message: 'All fields required' }); return }
    const request = await prisma.leaveRequest.create({ data: { studentId: req.user!.userId, fromDate, toDate, reason } })
    await notifyAllOfRole('HEADMASTER', 'leave', 'New Leave Request', `${req.user!.name || 'A student'} applied for leave (${fromDate} to ${toDate})`)
    res.json({ success: true, data: request })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// PUT /api/leave/:id — teacher or headmaster approves/rejects
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }

    const leaveId = parseInt(req.params.id)
    const existing = await prisma.leaveRequest.findUnique({ where: { id: leaveId } })
    if (!existing) { res.status(404).json({ success: false, message: 'Not found' }); return }

    // Teacher can only review leave for their own students
    if (req.user!.role === 'TEACHER') {
      const owns = await teacherOwnsStudent(req.user!.userId, existing.studentId)
      if (!owns) { res.status(403).json({ success: false, message: 'You can only review leave for your own students' }); return }
    }

    const { status, teacherComment } = req.body
    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status, teacherComment: teacherComment || null, reviewedBy: req.user!.userId },
    })
    await notify(updated.studentId, 'STUDENT', 'leave', `Leave Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`, `Your leave request (${updated.fromDate} to ${updated.toDate}) was ${status?.toLowerCase()}.`)
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Leave Reviewed', `Leave #${updated.id} marked ${status}`)
    res.json({ success: true, data: updated })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// DELETE /api/leave/:id — student cancels own pending; HEADMASTER can cancel any pending
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Teachers cannot delete leave requests — they approve/reject only (PUT)
    if (req.user!.role === 'TEACHER') { res.status(403).json({ success: false, message: 'Teachers cannot delete leave requests. Use approve/reject instead.' }); return }
    const leaveReq = await prisma.leaveRequest.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!leaveReq) { res.status(404).json({ success: false, message: 'Not found' }); return }
    // Student can only cancel their own
    if (req.user!.role === 'STUDENT' && leaveReq.studentId !== req.user!.userId) { res.status(403).json({ success: false, message: 'You can only cancel your own leave requests' }); return }
    if (leaveReq.status !== 'PENDING') { res.status(400).json({ success: false, message: 'Cannot cancel a request that has already been processed' }); return }
    await prisma.leaveRequest.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ success: true, message: 'Leave request cancelled' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
