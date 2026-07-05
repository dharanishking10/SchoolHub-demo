import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { verifyToken, AuthRequest } from '../middleware/auth'
import { notifyAllOfRole, audit } from '../utils/activityLog'

const router = Router()
const prisma = new PrismaClient()

async function generateAdmissionNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.student.count()
  return `ADM${year}${String(count + 1).padStart(4, '0')}`
}

function generateUsername(fullName: string, rollNumber: string): string {
  const first = fullName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')
  return `${first}_${rollNumber.toLowerCase()}`
}

function generatePassword(fullName: string, dob: string): string {
  const name = fullName.split(' ')[0]
  const year = dob ? dob.split('-')[0] : '2010'
  return `${name}@${year}`
}

async function teacherOwnsStudent(teacherId: number, studentId: number): Promise<boolean> {
  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { createdByTeacherId: true } })
  return student?.createdByTeacherId === teacherId
}

// GET /api/students/stats
router.get('/stats', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isTeacher = req.user!.role === 'TEACHER'
    const teacherFilter = isTeacher ? { createdByTeacherId: req.user!.userId } : {}

    const [total, boys, girls, active, byClass] = await Promise.all([
      prisma.student.count({ where: teacherFilter }),
      prisma.student.count({ where: { ...teacherFilter, gender: 'MALE' } }),
      prisma.student.count({ where: { ...teacherFilter, gender: 'FEMALE' } }),
      prisma.student.count({ where: { ...teacherFilter, status: 'ACTIVE' } }),
      prisma.student.groupBy({ by: ['className'], where: teacherFilter, _count: { id: true }, orderBy: { className: 'asc' } }),
    ])
    res.json({ success: true, data: { total, boys, girls, active, classData: byClass.map(c => ({ className: c.className, count: c._count.id })) } })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// GET /api/students
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search = '', className = '', section = '', status = '', gender = '', teacherId = '', page = '1', limit = '10' } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where: Record<string, unknown> = {}

    if (req.user!.role === 'STUDENT') {
      where.id = req.user!.userId
    } else if (req.user!.role === 'TEACHER') {
      where.createdByTeacherId = req.user!.userId
    } else if (teacherId) {
      // HM can filter by teacher
      where.createdByTeacherId = parseInt(teacherId)
    }

    if (className) where.className = className
    if (section) where.section = section
    if (status) where.status = status
    if (gender) where.gender = gender
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { admissionNumber: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } },
        { fatherName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        select: { id: true, admissionNumber: true, fullName: true, gender: true, dateOfBirth: true, bloodGroup: true, photo: true, fatherName: true, motherName: true, mobile: true, address: true, className: true, section: true, rollNumber: true, username: true, status: true, createdAt: true, createdByTeacherId: true, createdByTeacher: { select: { id: true, fullName: true, employeeId: true } } },
      }),
      prisma.student.count({ where }),
    ])
    res.json({ success: true, data: { students, total, page: parseInt(page), limit: parseInt(limit) } })
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error' }) }
})

// GET /api/students/:id
router.get('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    if (req.user!.role === 'STUDENT' && req.user!.userId !== id) { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    if (req.user!.role === 'TEACHER') {
      const owns = await teacherOwnsStudent(req.user!.userId, id)
      if (!owns) { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    }
    const student = await prisma.student.findUnique({
      where: { id },
      select: { id: true, admissionNumber: true, fullName: true, gender: true, dateOfBirth: true, bloodGroup: true, photo: true, fatherName: true, motherName: true, mobile: true, address: true, className: true, section: true, rollNumber: true, username: true, status: true, createdAt: true, createdByTeacher: { select: { id: true, fullName: true, employeeId: true, subject: true } } },
    })
    if (!student) { res.status(404).json({ success: false, message: 'Not found' }); return }
    res.json({ success: true, data: { student } })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/students — HEADMASTER or TEACHER
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const { fullName, gender, dateOfBirth, bloodGroup, fatherName, motherName, mobile, address, className, section, rollNumber, status } = req.body
    if (!fullName || !gender || !className || !section || !rollNumber) { res.status(400).json({ success: false, message: 'Required fields missing' }); return }

    const admissionNumber = await generateAdmissionNumber()
    const username = generateUsername(fullName, rollNumber)
    const plainPassword = generatePassword(fullName, dateOfBirth || '')
    const hashed = await bcrypt.hash(plainPassword, 10)

    const createdByTeacherId = req.user!.role === 'TEACHER' ? req.user!.userId : null

    const student = await prisma.student.create({
      data: { admissionNumber, fullName, gender, dateOfBirth: dateOfBirth || null, bloodGroup: bloodGroup || null, fatherName: fatherName || null, motherName: motherName || null, mobile: mobile || null, address: address || null, className, section, rollNumber, username, password: hashed, status: status || 'ACTIVE', createdByTeacherId },
      select: { id: true, admissionNumber: true, fullName: true, gender: true, className: true, section: true, rollNumber: true, username: true, status: true, createdAt: true },
    })
    await prisma.activity.create({ data: { type: 'student', message: `New student ${fullName} admitted (${admissionNumber})` } })
    await notifyAllOfRole('HEADMASTER', 'student', 'Student Added', `New student ${fullName} admitted (${admissionNumber})`)
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Student Added', `${fullName} (${admissionNumber})`)
    res.json({ success: true, data: { student, generatedPassword: plainPassword, generatedUsername: username } })
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e.code === 'P2002') { res.status(409).json({ success: false, message: 'Roll number or username already exists' }); return }
    console.error(err); res.status(500).json({ success: false, message: 'Server error' })
  }
})

// PUT /api/students/:id
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const id = parseInt(req.params.id)

    if (req.user!.role === 'TEACHER') {
      const owns = await teacherOwnsStudent(req.user!.userId, id)
      if (!owns) { res.status(403).json({ success: false, message: 'You can only edit students you created' }); return }
    }

    const { fullName, gender, dateOfBirth, bloodGroup, fatherName, motherName, mobile, address, className, section, rollNumber, status } = req.body
    const student = await prisma.student.update({
      where: { id },
      data: { fullName, gender, dateOfBirth: dateOfBirth || null, bloodGroup: bloodGroup || null, fatherName: fatherName || null, motherName: motherName || null, mobile: mobile || null, address: address || null, className, section, rollNumber, status },
      select: { id: true, admissionNumber: true, fullName: true, gender: true, className: true, section: true, rollNumber: true, username: true, status: true },
    })
    await prisma.activity.create({ data: { type: 'student', message: `Student ${fullName} profile updated` } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Student Updated', `${fullName}`)
    res.json({ success: true, data: { student } })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// PATCH /api/students/:id/reset-password — HEADMASTER only
router.patch('/:id/reset-password', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'HEADMASTER') { res.status(403).json({ success: false, message: 'Headmaster only' }); return }
    const id = parseInt(req.params.id)
    const student = await prisma.student.findUnique({ where: { id }, select: { fullName: true, dateOfBirth: true, admissionNumber: true } })
    if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return }
    const plainPassword = generatePassword(student.fullName, student.dateOfBirth || '')
    const hashed = await bcrypt.hash(plainPassword, 10)
    await prisma.student.update({ where: { id }, data: { password: hashed } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Password Reset', `${student.fullName} (${student.admissionNumber})`)
    res.json({ success: true, data: { newPassword: plainPassword } })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// DELETE /api/students/:id
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'STUDENT') { res.status(403).json({ success: false, message: 'Not allowed' }); return }
    const id = parseInt(req.params.id)

    if (req.user!.role === 'TEACHER') {
      const owns = await teacherOwnsStudent(req.user!.userId, id)
      if (!owns) { res.status(403).json({ success: false, message: 'You can only delete students you created' }); return }
    }

    const student = await prisma.student.findUnique({ where: { id } })
    if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return }
    await prisma.student.delete({ where: { id } })
    await prisma.activity.create({ data: { type: 'student', message: `Student ${student.fullName} removed from records` } })
    await audit(req.user!.userId, req.user!.name || 'User', req.user!.role, 'Student Deleted', `${student.fullName} (${student.admissionNumber})`)
    res.json({ success: true, message: 'Student deleted' })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

export default router
