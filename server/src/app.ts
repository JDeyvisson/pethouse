import express from 'express'
import cors from 'cors'
import path from 'path'
import { errorHandler } from './middleware/error'
import authRoutes from './routes/auth.routes'
import petsRoutes from './routes/pets.routes'
import hostsRoutes from './routes/hosts.routes'
import reservasRoutes from './routes/reservas.routes'
import dashboardRoutes from './routes/dashboard.routes'
import reviewsRoutes from './routes/reviews.routes'
import paymentCardsRoutes from './routes/payment-cards.routes'
import subscriptionsRoutes from './routes/subscriptions.routes'
import messagesRoutes from './routes/messages.routes'

const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())

// Static uploads
const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? './uploads')
app.use('/uploads', express.static(uploadDir))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/pets', petsRoutes)
app.use('/api/hosts', hostsRoutes)
app.use('/api/reservas', reservasRoutes)
app.use('/api', dashboardRoutes)
app.use('/api/reviews', reviewsRoutes)
app.use('/api/payment-cards', paymentCardsRoutes)
app.use('/api/subscriptions', subscriptionsRoutes)
app.use('/api/messages', messagesRoutes)

// Error handler (must be last)
app.use(errorHandler)

export default app
