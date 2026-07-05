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

const classInclude = {
  classTeacher: { select: { id: true, fullName: true, subject: true, employeeId: true } },
}

async function withStudentCount(cls: { id: number; name: string; section: string; academicYear: string; [key: string]: unknown }) {
  const count = await prisma.student.count({
    where: { className: cls.name, section: cls.section, status: 'ACTIVE' },
  })
  return { ...cls, currentStudentCount: count }
}

// ── GET /api/classes/mine  (student sees own class) ──────────────────────────
router.get('/mine', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'STUDENT') {
      res.status(403).json({ success: false, message: 'Student access only' })
      return
    }
    const student = await prisma.student.findUnique({
      where: { username: req.user.username },
      select: { className: true, section: true },
    })
    if (!student) {
      res.status(404).json({ success: false, message: 'Student record not found' })
      return
    }
    const cls = await prisma.schoolClass.findFirst({
      where: { name: student.className, section: student.section },
      include: classInclude,
    })
    if (!cls) {
      res.json({ success: true, data: null })
      return
    }
    const withCount = await withStudentCount(cls as Parameters<typeof withStudentCount>[0])
    res.json({ success: true, data: withCount })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ── GET /api/classes ─────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role === 'STUDENT') {
      res.status(403).json({ success: false, message: 'Access denied' })
      return
    }

    const {
      search = '',
      academicYear = '',
      status = '',
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where: Record<string, unknown> = {}

    // Teachers: automatically scope to their assigned classes
    if (req.user?.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { username: req.user.username } })
      if (!teacher) {
        res.json({ success: true, data: { classes: [], total: 0, page: 1, limit: parseInt(limit), academicYears: [], totalStudents: 0, availableSeats: 0 } })
        return
      }
      where.classTeacherId = teacher.id
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { section: { contains: search, mode: 'insensitive' } },
        { academicYear: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (academicYear) where.academicYear = academicYear
    if (status) where.status = status

    const [total, classes] = await Promise.all([
      prisma.schoolClass.count({ where }),
      prisma.schoolClass.findMany({
        where,
        include: classInclude,
        orderBy: [{ academicYear: 'desc' }, { name: 'asc' }, { section: 'asc' }],
        skip,
        take: parseInt(limit),
      }),
    ])

    const classesWithCount = await Promise.all(classes.map(withStudentCount))

    const years = await prisma.schoolClass.findMany({
      select: { academicYear: true },
      where: where.classTeacherId ? { classTeacherId: where.classTeacherId as number } : {},
      distinct: ['academicYear'],
      orderBy: { academicYear: 'desc' },
    })

    // Aggregate stats (headmaster view)
    let totalStudents = 0
    let availableSeats = 0
    if (req.user?.role === 'HEADMASTER') {
      const [studentCount, seatAggregate] = await Promise.all([
        prisma.student.count({ where: { status: 'ACTIVE' } }),
        prisma.schoolClass.aggregate({ _sum: { maxStrength: true } }),
      ])
      totalStudents = studentCount
      availableSeats = Math.max(0, (seatAggregate._sum.maxStrength || 0) - studentCount)
    }

    res.json({
      success: true,
      data: {
        classes: classesWithCount,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        academicYears: years.map(y => y.academicYear),
        totalStudents,
        availableSeats,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ── GET /api/classes/:id ─────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role === 'STUDENT') {
      res.status(403).json({ success: false, message: 'Access denied' })
      return
    }
    const cls = await prisma.schoolClass.findUnique({
      where: { id: parseInt(req.params.id) },
      include: classInclude,
    })
    if (!cls) { res.status(404).json({ success: false, message: 'Class not found' }); return }
    const withCount = await withStudentCount(cls as Parameters<typeof withStudentCount>[0])
    res.json({ success: true, data: withCount })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ── POST /api/classes ────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireHeadmaster(req, res)) return
  try {
    const { name, section, academicYear, classTeacherId, roomNumber, maxStrength, status } = req.body as {
      name: string; section: string; academicYear: string; classTeacherId?: number | string
      roomNumber?: string; maxStrength?: number; status?: string
    }

    if (!name || !section || !academicYear) {
      res.status(400).json({ success: false, message: 'Class name, section, and academic year are required' })
      return
    }

    const existing = await prisma.schoolClass.findUnique({
      where: { name_section_academicYear: { name, section, academicYear } },
    })
    if (existing) {
      res.status(409).json({ success: false, message: `Class ${name}-${section} already exists for ${academicYear}` })
      return
    }

    const cls = await prisma.schoolClass.create({
      data: {
        name,
        section,
        academicYear,
        classTeacherId: classTeacherId ? parseInt(String(classTeacherId)) : null,
        roomNumber: roomNumber || '',
        maxStrength: maxStrength ? parseInt(String(maxStrength)) : 40,
        status: status || 'ACTIVE',
      },
      include: classInclude,
    })

    await audit(req.user!.userId, req.user!.username, req.user!.role, 'CLASS_CREATED', `Created class ${name}-${section} (${academicYear})`)

    const withCount = await withStudentCount(cls as Parameters<typeof withStudentCount>[0])
    res.status(201).json({ success: true, data: withCount, message: 'Class created successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ── PUT /api/classes/:id ─────────────────────────────────────────────────────
router.put('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireHeadmaster(req, res)) return
  try {
    const id = parseInt(req.params.id)
    const { name, section, academicYear, classTeacherId, roomNumber, maxStrength, status } = req.body as {
      name: string; section: string; academicYear: string; classTeacherId?: number | string | null
      roomNumber?: string; maxStrength?: number; status?: string
    }

    if (!name || !section || !academicYear) {
      res.status(400).json({ success: false, message: 'Class name, section, and academic year are required' })
      return
    }

    const existing = await prisma.schoolClass.findFirst({
      where: { name, section, academicYear, NOT: { id } },
    })
    if (existing) {
      res.status(409).json({ success: false, message: `Class ${name}-${section} already exists for ${academicYear}` })
      return
    }

    const cls = await prisma.schoolClass.update({
      where: { id },
      data: {
        name,
        section,
        academicYear,
        classTeacherId: classTeacherId ? parseInt(String(classTeacherId)) : null,
        roomNumber: roomNumber || '',
        maxStrength: maxStrength ? parseInt(String(maxStrength)) : 40,
        status: status || 'ACTIVE',
      },
      include: classInclude,
    })

    await audit(req.user!.userId, req.user!.username, req.user!.role, 'CLASS_UPDATED', `Updated class ${name}-${section} (${academicYear})`)

    const withCount = await withStudentCount(cls as Parameters<typeof withStudentCount>[0])
    res.json({ success: true, data: withCount, message: 'Class updated successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ── DELETE /api/classes/:id ──────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!requireHeadmaster(req, res)) return
  try {
    const id = parseInt(req.params.id)
    const cls = await prisma.schoolClass.findUnique({ where: { id } })
    if (!cls) { res.status(404).json({ success: false, message: 'Class not found' }); return }

    await prisma.schoolClass.delete({ where: { id } })
    await audit(req.user!.userId, req.user!.username, req.user!.role, 'CLASS_DELETED', `Deleted class ${cls.name}-${cls.section} (${cls.academicYear})`)

    res.json({ success: true, message: 'Class deleted successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router
