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
import notificationsRouter from './routes/notifications'
import announcementsRouter from './routes/announcements'
import auditLogRouter from './routes/auditlog'
import searchRouter from './routes/search'
import exportRouter from './routes/export'
import schemesRouter from './routes/schemes'
import examsRouter from './routes/exams'
import subjectsRouter from './routes/subjects'
import examMarksRouter from './routes/exammarks'

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
app.use('/api/notifications', notificationsRouter)
app.use('/api/announcements', announcementsRouter)
app.use('/api/audit-log', auditLogRouter)
app.use('/api/search', searchRouter)
app.use('/api/export', exportRouter)
app.use('/api/schemes', schemesRouter)
app.use('/api/exams', examsRouter)
app.use('/api/subjects', subjectsRouter)
app.use('/api/exam-marks', examMarksRouter)

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 EduGov Connect API on port ${PORT}`))
