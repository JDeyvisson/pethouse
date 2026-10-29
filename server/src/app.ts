import accountRoutes from './routes/account.routes'
import { prisma } from './lib/prisma'
import { verifyToken } from './middleware/auth'
import { privateUploadDir } from './middleware/upload'
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
app.get('/private-documents/:filename', verifyToken, async (req, res, next) => {
  try {
    const name = req.params.filename
    if (!/^[a-f0-9-]+\.(png|jpg)$/.test(name)) return res.sendStatus(404)
    const host = await prisma.hostProfile.findUnique({ where: { userId: req.user.sub } })
    if (!host || host.docPhotoUrl !== `/private-documents/${name}`) return res.sendStatus(403)
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.sendFile(path.join(privateUploadDir, name))
  } catch (err) { next(err) }
})
// Also deny historical identity documents that were stored in the public folder.
app.use('/uploads', async (req, res, next) => {
  try {
    const decoded = decodeURIComponent(req.path)
    if (!/^\/[a-zA-Z0-9._-]+\.(png|jpe?g)$/i.test(decoded)) return res.sendStatus(404)
    const url = `/uploads${decoded}`
    const doc = await prisma.hostProfile.findFirst({ where: { docPhotoUrl: { equals: url, mode: 'insensitive' } }, select: { id: true } })
    if (doc) return res.sendStatus(404)
    const [pet, user, host] = await Promise.all([
      prisma.pet.findFirst({ where: { photoUrl: url }, select: { id: true } }),
      prisma.user.findFirst({ where: { photoUrl: url }, select: { id: true } }),
      prisma.hostProfile.findFirst({ where: { OR: [{ housePhotos: { has: url } }, { spacePhotos: { has: url } }] }, select: { id: true } }),
    ])
    if (!pet && !user && !host) return res.sendStatus(404)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    next()
  } catch (err) { next(err) }
}, express.static(uploadDir))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/auth', accountRoutes)
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
