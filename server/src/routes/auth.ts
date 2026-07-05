import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { signToken, verifyToken, AuthRequest } from '../middleware/auth'
import { LoginRequest } from '../types'

const router = Router()
const prisma = new PrismaClient()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body as LoginRequest

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required' })
      return
    }

    // 1. Try User table (Headmaster)
    const user = await prisma.user.findUnique({ where: { username } })
    if (user) {
      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) { res.status(401).json({ success: false, message: 'Invalid credentials' }); return }
      const token = signToken({ userId: user.id, username: user.username, role: user.role as 'HEADMASTER' | 'TEACHER' | 'STUDENT', name: user.name || user.username })
      res.json({ success: true, data: { token, user: { id: user.id, username: user.username, role: user.role, name: user.name } } })
      return
    }

    // 2. Try Teacher table
    const teacher = await prisma.teacher.findUnique({ where: { username } })
    if (teacher) {
      const isValid = await bcrypt.compare(password, teacher.password)
      if (!isValid) { res.status(401).json({ success: false, message: 'Invalid credentials' }); return }
      const token = signToken({ userId: teacher.id, username: teacher.username, role: 'TEACHER', name: teacher.fullName })
      res.json({ success: true, data: { token, user: { id: teacher.id, username: teacher.username, role: 'TEACHER', name: teacher.fullName } } })
      return
    }

    // 3. Try Student table
    const student = await prisma.student.findUnique({ where: { username } })
    if (student) {
      const isValid = await bcrypt.compare(password, student.password || '')
      if (!isValid) { res.status(401).json({ success: false, message: 'Invalid credentials' }); return }
      const token = signToken({ userId: student.id, username: student.username || '', role: 'STUDENT', name: student.fullName })
      res.json({ success: true, data: { token, user: { id: student.id, username: student.username, role: 'STUDENT', name: student.fullName, admissionNumber: student.admissionNumber, className: student.className, section: student.section } } })
      return
    }

    res.status(401).json({ success: false, message: 'Invalid credentials' })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// PUT /change-password — TEACHER only (must supply current password)
router.put('/change-password', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== 'TEACHER') {
      res.status(403).json({ success: false, message: 'Only teachers can change their own password' }); return
    }
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Current and new password are required' }); return
    }
    if (newPassword.length < 8) {
      res.status(400).json({ success: false, message: 'New password must be at least 8 characters' }); return
    }
    const hasUpper = /[A-Z]/.test(newPassword)
    const hasLower = /[a-z]/.test(newPassword)
    const hasNumOrSpecial = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)
    if (!hasUpper || !hasLower || !hasNumOrSpecial) {
      res.status(400).json({ success: false, message: 'Password must contain uppercase, lowercase, and a number or special character' }); return
    }
    const teacher = await prisma.teacher.findUnique({ where: { id: req.user!.userId } })
    if (!teacher) { res.status(404).json({ success: false, message: 'Teacher not found' }); return }
    const isValid = await bcrypt.compare(currentPassword, teacher.password)
    if (!isValid) { res.status(401).json({ success: false, message: 'Current password is incorrect' }); return }
    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.teacher.update({ where: { id: teacher.id }, data: { password: hashed } })
    res.json({ success: true, message: 'Password changed successfully' })
  } catch { res.status(500).json({ success: false, message: 'Internal server error' }) }
})

router.get('/me', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user!.role === 'HEADMASTER') {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { id: true, username: true, role: true, name: true, email: true } })
      res.json({ success: true, data: { user } })
    } else if (req.user!.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { id: req.user!.userId }, select: { id: true, username: true, fullName: true, subject: true, employeeId: true, mobile: true, email: true, status: true } })
      res.json({ success: true, data: { user: { ...teacher, role: 'TEACHER', name: teacher?.fullName } } })
    } else {
      const student = await prisma.student.findUnique({ where: { id: req.user!.userId }, select: { id: true, username: true, fullName: true, admissionNumber: true, className: true, section: true, rollNumber: true, gender: true, fatherName: true, motherName: true, mobile: true, address: true, dateOfBirth: true, status: true } })
      res.json({ success: true, data: { user: { ...student, role: 'STUDENT', name: student?.fullName } } })
    }
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

export default router
