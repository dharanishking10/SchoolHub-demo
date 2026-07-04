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

    const user = await prisma.user.findUnique({ where: { username } })

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' })
      return
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' })
      return
    }

    const token = signToken({ userId: user.id, username: user.username, role: user.role as 'HEADMASTER' | 'TEACHER' | 'STUDENT' })

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
        },
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

router.get('/me', verifyToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, username: true, role: true, name: true, email: true },
    })
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    res.json({ success: true, data: { user } })
  } catch {
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

export default router
