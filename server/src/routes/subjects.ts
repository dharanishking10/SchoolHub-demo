import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { audit } from '../utils/activityLog'

const router = Router()
const prisma = new PrismaClient()

function requireHeadmaster(req: AuthRequest, res: Response): boolean {
  if (req.user?.role !== 'HEADMASTER') {
    res.status(403).json({ success: false, message: 'Headmaster access only' })
    return false
  }
  return true
}

// GET /api/subjects
router.get('/', verifyToken, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subjects = await prisma.subject.findMany({ orderBy: { subjectName: 'asc' } })
    res.json({ success: true, data: subjects })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/subjects — HEADMASTER only
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireHeadmaster(req, res)) return
  try {
    const { subjectName, subjectCode } = req.body as Record<string, string>
    if (!subjectName || !subjectCode) { res.status(400).json({ success: false, message: 'Subject name and code are required' }); return }

    const existing = await prisma.subject.findUnique({ where: { subjectCode } })
    if (existing) { res.status(409).json({ success: false, message: `Subject code "${subjectCode}" already exists` }); return }

    const subject = await prisma.subject.create({ data: { subjectName, subjectCode } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Subject Created', `${subjectName} (${subjectCode})`)
    res.status(201).json({ success: true, data: subject, message: 'Subject created successfully' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// PUT /api/subjects/:id — HEADMASTER only
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireHeadmaster(req, res)) return
  try {
    const id = parseInt(req.params.id)
    const { subjectName, subjectCode } = req.body as Record<string, string>
    if (!subjectName || !subjectCode) { res.status(400).json({ success: false, message: 'Subject name and code are required' }); return }

    const duplicate = await prisma.subject.findFirst({ where: { subjectCode, NOT: { id } } })
    if (duplicate) { res.status(409).json({ success: false, message: `Subject code "${subjectCode}" already exists` }); return }

    const subject = await prisma.subject.update({ where: { id }, data: { subjectName, subjectCode } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Subject Updated', `${subjectName} (${subjectCode})`)
    res.json({ success: true, data: subject, message: 'Subject updated successfully' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// DELETE /api/subjects/:id — HEADMASTER only
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireHeadmaster(req, res)) return
  try {
    const id = parseInt(req.params.id)
    const subject = await prisma.subject.findUnique({ where: { id } })
    if (!subject) { res.status(404).json({ success: false, message: 'Subject not found' }); return }
    await prisma.subject.delete({ where: { id } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Subject Deleted', `${subject.subjectName} (${subject.subjectCode})`)
    res.json({ success: true, message: 'Subject deleted successfully' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
