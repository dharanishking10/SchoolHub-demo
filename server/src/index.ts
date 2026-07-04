import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRouter from './routes/auth'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

app.use(cors({
  origin: ['http://localhost:5000', `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost'}`],
  credentials: true,
}))

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'EduGov Connect API is running' })
})

app.use('/api/auth', authRouter)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 EduGov Connect API running on port ${PORT}`)
})
