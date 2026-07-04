import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import dashboardRouter from './routes/dashboard'
import teachersRouter from './routes/teachers'
import studentsRouter from './routes/students'
import classesRouter from './routes/classes'
import schoolRouter from './routes/school'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'EduGov Connect API running' }))
app.use('/api/auth', authRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/teachers', teachersRouter)
app.use('/api/students', studentsRouter)
app.use('/api/classes', classesRouter)
app.use('/api/school', schoolRouter)

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 EduGov Connect API on port ${PORT}`))
