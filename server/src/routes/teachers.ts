import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { notifyAllOfRole, audit } from '../utils/activityLog'

const router = Router()
const prisma = new PrismaClient()

function generatePassword(name: string): string {
  const prefix = name.split(' ')[0].slice(0, 3).toUpperCase()
  const num = Math.floor(10000 + Math.random() * 90000)
  return `${prefix}@${num}`
}

router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search = '', subject = '', status = '', page = '1', limit = '10' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: Record<string, unknown> = {}
    if (subject) where.subject = subject
    if (status) where.status = status
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
      ]
    }
    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' }, select: { id: true, fullName: true, employeeId: true, mobile: true, email: true, subject: true, username: true, status: true, createdAt: true } }),
      prisma.teacher.count({ where }),
    ])
    res.json({ success: true, data: { teachers, total, page: parseInt(page), limit: parseInt(limit) } })
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }) }
})

router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, employeeId, mobile, email, subject, username, status } = req.body
    if (!fullName || !employeeId || !mobile || !subject || !username) { res.status(400).json({ success: false, message: 'Required fields missing' }); return }
    const plainPassword = generatePassword(fullName)
    const hashed = await bcrypt.hash(plainPassword, 10)
    const teacher = await prisma.teacher.create({
      data: { fullName, employeeId, mobile, email: email || null, subject, username, password: hashed, status: status || 'ACTIVE' },
      select: { id: true, fullName: true, employeeId: true, mobile: true, email: true, subject: true, username: true, status: true, createdAt: true },
    })
    await prisma.activity.create({ data: { type: 'teacher', message: `New teacher ${fullName} (${employeeId}) was added` } })
    await notifyAllOfRole('HEADMASTER', 'teacher', 'Teacher Added', `New teacher ${fullName} (${employeeId}) was added`)
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Teacher Added', `${fullName} (${employeeId})`)
    res.json({ success: true, data: { teacher, generatedPassword: plainPassword } })
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e.code === 'P2002') { res.status(409).json({ success: false, message: 'Employee ID or username already exists' }); return }
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { fullName, mobile, email, subject, username, status } = req.body
    const teacher = await prisma.teacher.update({
      where: { id },
      data: { fullName, mobile, email: email || null, subject, username, status },
      select: { id: true, fullName: true, employeeId: true, mobile: true, email: true, subject: true, username: true, status: true },
    })
    await prisma.activity.create({ data: { type: 'teacher', message: `Teacher ${fullName} profile updated` } })
    res.json({ success: true, data: { teacher } })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const teacher = await prisma.teacher.findUnique({ where: { id } })
    if (!teacher) { res.status(404).json({ success: false, message: 'Teacher not found' }); return }
    await prisma.teacher.delete({ where: { id } })
    await prisma.activity.create({ data: { type: 'teacher', message: `Teacher ${teacher.fullName} was removed` } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Teacher Deleted', `${teacher.fullName} (${teacher.employeeId})`)
    res.json({ success: true, message: 'Teacher deleted' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
