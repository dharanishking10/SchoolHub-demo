import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, requireRole, AuthRequest } from '../middleware/auth'
import { audit } from '../utils/activityLog'

const router = Router()
const prisma = new PrismaClient()

router.get('/', verifyToken, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.schoolProfile.findFirst()
    res.json({ success: true, data: { profile } })
  } catch {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

router.put('/', verifyToken, requireRole('HEADMASTER'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      schoolName, schoolCode, emisCode, udiseCode, address,
      district, block, panchayat, pinCode, contactNumber,
      email, headmasterName, logoUrl, academicYear,
    } = req.body
    if (!schoolName || !schoolCode || !district || !block || !academicYear || !headmasterName) {
      res.status(400).json({ success: false, message: 'Required fields missing' })
      return
    }
    const data = {
      schoolName, schoolCode,
      emisCode: emisCode || '',
      udiseCode: udiseCode || '',
      address: address || '',
      district, block,
      panchayat: panchayat || '',
      pinCode: pinCode || '',
      contactNumber: contactNumber || '',
      email: email || '',
      headmasterName,
      logoUrl: logoUrl || '',
      academicYear,
    }
    const existing = await prisma.schoolProfile.findFirst()
    const profile = existing
      ? await prisma.schoolProfile.update({ where: { id: existing.id }, data })
      : await prisma.schoolProfile.create({ data })
    await prisma.activity.create({ data: { type: 'profile', message: 'School profile updated' } })
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        userName: req.user!.name || req.user!.username,
        userRole: req.user!.role,
        action: 'UPDATE_SCHOOL_PROFILE',
        details: `Updated school profile for "${schoolName}"`,
      },
    })
    res.json({ success: true, data: { profile } })
  } catch {
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ── Promotion helpers ────────────────────────────────────────────────────────

const CLASS_ORDER = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as const
type ClassName = typeof CLASS_ORDER[number]

function nextAcademicYear(current: string): string {
  const parts = current.split('-')
  if (parts.length === 2) {
    const y1 = parseInt(parts[0], 10)
    const y2 = parseInt(parts[1], 10)
    if (!isNaN(y1) && !isNaN(y2)) return `${y1 + 1}-${y2 + 1}`
  }
  return current
}

// GET /api/school/promotion/preview
router.get('/promotion/preview', verifyToken, requireRole('HEADMASTER'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await prisma.schoolProfile.findFirst()
    if (!profile) { res.status(404).json({ success: false, message: 'School profile not found' }); return }

    const currentYear = profile.academicYear
    const nextYear = nextAcademicYear(currentYear)
    const canPromote = currentYear !== nextYear

    // Count ACTIVE students per class
    const counts = await prisma.student.groupBy({
      by: ['className'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    })
    const byClass: Record<string, number> = {}
    for (const row of counts) byClass[row.className] = row._count.id

    const classes = CLASS_ORDER.map((cls, i) => ({
      className: cls,
      studentCount: byClass[cls] || 0,
      action: cls === 'XII' ? 'GRADUATE' : `PROMOTE_TO_${CLASS_ORDER[i + 1]}`,
      nextClass: cls === 'XII' ? null : CLASS_ORDER[i + 1],
    }))

    const totalActive = Object.values(byClass).reduce((a, b) => a + b, 0)
    const graduating = byClass['XII'] || 0
    const promoting = totalActive - graduating

    res.json({
      success: true,
      data: { currentYear, nextYear, classes, totalActive, promoting, graduating, canPromote },
    })
  } catch { res.status(500).json({ success: false, message: 'Server error' }) }
})

// POST /api/school/promote — atomic promotion with idempotency guard
router.post('/promote', verifyToken, requireRole('HEADMASTER'), async (req: AuthRequest, res: Response): Promise<void> => {
  let currentYear = ''
  try {
    const profile = await prisma.schoolProfile.findFirst()
    if (!profile) { res.status(404).json({ success: false, message: 'School profile not found' }); return }

    currentYear = profile.academicYear
    const nextYear = nextAcademicYear(currentYear)

    if (currentYear === nextYear) {
      res.status(400).json({ success: false, message: 'Cannot determine next academic year — please update the academic year format in School Profile (e.g. 2026-2027)' }); return
    }

    // Count ACTIVE students per class before promotion (for the summary)
    const counts = await prisma.student.groupBy({
      by: ['className'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    })
    const byClass: Record<string, number> = {}
    for (const row of counts) byClass[row.className] = row._count.id
    const graduating = byClass['XII'] || 0
    const promoting = Object.values(byClass).reduce((a, b) => a + b, 0) - graduating

    // Run all updates in an interactive transaction with a concurrency guard:
    // re-read the profile inside the transaction and abort if the year has already
    // been advanced (guards against concurrent/double submissions).
    await prisma.$transaction(async (tx) => {
      const freshProfile = await tx.schoolProfile.findUnique({ where: { id: profile.id } })
      if (!freshProfile || freshProfile.academicYear !== currentYear) {
        throw Object.assign(new Error('ALREADY_PROMOTED'), { code: 'ALREADY_PROMOTED' })
      }

      // Graduate XII first, then promote each lower class upward
      await tx.student.updateMany({ where: { className: 'XII', status: 'ACTIVE' }, data: { status: 'GRADUATED' } })
      await tx.student.updateMany({ where: { className: 'XI', status: 'ACTIVE' }, data: { className: 'XII' } })
      await tx.student.updateMany({ where: { className: 'X', status: 'ACTIVE' }, data: { className: 'XI' } })
      await tx.student.updateMany({ where: { className: 'IX', status: 'ACTIVE' }, data: { className: 'X' } })
      await tx.student.updateMany({ where: { className: 'VIII', status: 'ACTIVE' }, data: { className: 'IX' } })
      await tx.student.updateMany({ where: { className: 'VII', status: 'ACTIVE' }, data: { className: 'VIII' } })
      await tx.student.updateMany({ where: { className: 'VI', status: 'ACTIVE' }, data: { className: 'VII' } })
      await tx.schoolProfile.update({ where: { id: profile.id }, data: { academicYear: nextYear } })
    })

    await audit(
      req.user!.userId,
      req.user!.name || req.user!.username,
      req.user!.role,
      'ACADEMIC_PROMOTION',
      `Promoted ${promoting} students and graduated ${graduating} students. Year: ${currentYear} → ${nextYear}`,
    )

    res.json({
      success: true,
      data: { previousYear: currentYear, currentYear: nextYear, promoted: promoting, graduated: graduating },
    })
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'ALREADY_PROMOTED' || e.message === 'ALREADY_PROMOTED') {
      res.status(409).json({ success: false, message: `Year ${currentYear} has already been promoted. Please refresh the page to see the updated academic year.` }); return
    }
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error during promotion' })
  }
})

export default router
