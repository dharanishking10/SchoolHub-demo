import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { notifyAllOfRole, audit } from '../utils/activityLog'

const router = Router()
const prisma = new PrismaClient()

function requireHeadmaster(req: AuthRequest, res: Response): boolean {
  if (req.user?.role !== 'HEADMASTER') {
    res.status(403).json({ success: false, message: 'Headmaster access only' })
    return false
  }
  return true
}

// GET /api/exams
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { academicYear } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}
    if (academicYear) where.academicYear = academicYear
    const exams = await prisma.exam.findMany({ where, orderBy: [{ academicYear: 'desc' }, { createdAt: 'desc' }] })
    res.json({ success: true, data: exams })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// GET /api/exams/:id
router.get('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!exam) { res.status(404).json({ success: false, message: 'Exam not found' }); return }
    res.json({ success: true, data: exam })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/exams — HEADMASTER only
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireHeadmaster(req, res)) return
  try {
    const { examName, examType, academicYear, startDate, endDate } = req.body as Record<string, string>
    if (!examName || !academicYear || !startDate || !endDate) { res.status(400).json({ success: false, message: 'All fields are required' }); return }

    const existing = await prisma.exam.findUnique({ where: { examName_academicYear: { examName, academicYear } } })
    if (existing) { res.status(409).json({ success: false, message: `${examName} already exists for ${academicYear}` }); return }

    const exam = await prisma.exam.create({
      data: { examName, examType: examType || 'Unit Test 1', academicYear, startDate, endDate, status: 'DRAFT' },
    })
    await prisma.activity.create({ data: { type: 'exam', message: `Exam "${examName}" created for ${academicYear}` } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Exam Created', `${examName} (${academicYear})`)
    res.status(201).json({ success: true, data: exam, message: 'Exam created successfully' })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// PUT /api/exams/:id — HEADMASTER only
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireHeadmaster(req, res)) return
  try {
    const id = parseInt(req.params.id)
    const { examName, examType, academicYear, startDate, endDate } = req.body as Record<string, string>
    if (!examName || !academicYear || !startDate || !endDate) { res.status(400).json({ success: false, message: 'All fields are required' }); return }

    const duplicate = await prisma.exam.findFirst({ where: { examName, academicYear, NOT: { id } } })
    if (duplicate) { res.status(409).json({ success: false, message: `${examName} already exists for ${academicYear}` }); return }

    const exam = await prisma.exam.update({ where: { id }, data: { examName, examType, academicYear, startDate, endDate } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Exam Updated', `${examName} (${academicYear})`)
    res.json({ success: true, data: exam, message: 'Exam updated successfully' })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/exams/:id/publish — HEADMASTER only
router.post('/:id/publish', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireHeadmaster(req, res)) return
  try {
    const id = parseInt(req.params.id)
    const exam = await prisma.exam.findUnique({ where: { id } })
    if (!exam) { res.status(404).json({ success: false, message: 'Exam not found' }); return }

    const markCount = await prisma.mark.count({ where: { examId: id } })
    if (markCount === 0) { res.status(400).json({ success: false, message: 'Cannot publish an exam with no marks entered' }); return }

    const updated = await prisma.exam.update({ where: { id }, data: { status: 'PUBLISHED' } })
    await notifyAllOfRole('STUDENT', 'exam', 'Results Published', `Results for ${exam.examName} (${exam.academicYear}) have been published`)
    await prisma.activity.create({ data: { type: 'exam', message: `Results published for "${exam.examName}"` } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Results Published', `${exam.examName} (${exam.academicYear})`)
    res.json({ success: true, data: updated, message: 'Results published successfully' })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/exams/:id/unpublish — HEADMASTER only
router.post('/:id/unpublish', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireHeadmaster(req, res)) return
  try {
    const id = parseInt(req.params.id)
    const exam = await prisma.exam.findUnique({ where: { id } })
    if (!exam) { res.status(404).json({ success: false, message: 'Exam not found' }); return }
    const updated = await prisma.exam.update({ where: { id }, data: { status: 'DRAFT' } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Results Unpublished', `${exam.examName} (${exam.academicYear})`)
    res.json({ success: true, data: updated, message: 'Exam reverted to draft — marks are editable again' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// DELETE /api/exams/:id — HEADMASTER only
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireHeadmaster(req, res)) return
  try {
    const id = parseInt(req.params.id)
    const exam = await prisma.exam.findUnique({ where: { id } })
    if (!exam) { res.status(404).json({ success: false, message: 'Exam not found' }); return }
    await prisma.exam.delete({ where: { id } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Exam Deleted', `${exam.examName} (${exam.academicYear})`)
    res.json({ success: true, message: 'Exam deleted successfully' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
