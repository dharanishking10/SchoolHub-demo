import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'
import dashboardRouter from './routes/dashboard'
import teachersRouter from './routes/teachers'
import studentsRouter from './routes/students'
import classesRouter from './routes/classes'
import schoolRouter from './routes/school'
import attendanceRouter from './routes/attendance'
import marksRouter from './routes/marks'
import homeworkRouter from './routes/homework'
import timetableRouter from './routes/timetable'
import leaveRouter from './routes/leave'

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
app.use('/api/attendance', attendanceRouter)
app.use('/api/marks', marksRouter)
app.use('/api/homework', homeworkRouter)
app.use('/api/timetable', timetableRouter)
app.use('/api/leave', leaveRouter)

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 EduGov Connect API on port ${PORT}`))
