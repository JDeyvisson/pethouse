import { Router, Request, Response, NextFunction } from 'express'
import { verifyToken } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { hostRepository } from '../repositories/host.repository'
import { upload } from '../middleware/upload'

const router = Router()
router.use(verifyToken)

router.get('/users/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, name: true, email: true, role: true, phone: true, photoUrl: true },
    })
    res.json(user)
  } catch (err) { next(err) }
})

router.patch('/users/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone } = req.body as { name?: string; phone?: string }
    const user = await prisma.user.update({
      where: { id: req.user!.sub },
      data: {
        ...(name?.trim() ? { name: name.trim() } : {}),
        phone: phone?.trim() || null,
      },
      select: { id: true, name: true, email: true, role: true, phone: true, photoUrl: true },
    })
    res.json(user)
  } catch (err) { next(err) }
})

router.patch('/users/me/photo', upload.single('photo'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file as Express.Multer.File | undefined
    if (!file) return res.status(400).json({ error: { code: 'NO_FILE', message: 'Nenhum arquivo enviado' } })
    const photoUrl = `/uploads/${file.filename}`
    await prisma.user.update({
      where: { id: req.user!.sub },
      data: { photoUrl },
    })
    res.json({ photoUrl })
  } catch (err) { next(err) }
})

router.get('/dashboard/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const role = req.user!.role

    if (role === 'TUTOR') {
      const [tutorUser, petCount, reservas] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { city: true } }),
        prisma.pet.count({ where: { ownerId: userId } }),
        prisma.reserva.findMany({ where: { tutorId: userId } }),
      ])

      const cityFilter = tutorUser?.city
        ? { city: { contains: tutorUser.city, mode: 'insensitive' as const } }
        : {}

      let avgPrice = await prisma.hostProfile.aggregate({
        _avg: { pricePerDay: true },
        where: cityFilter,
      })

      // Fall back to global average if no hosts found in the tutor's city
      if (!avgPrice._avg.pricePerDay && tutorUser?.city) {
        avgPrice = await prisma.hostProfile.aggregate({ _avg: { pricePerDay: true } })
      }

      const totalSpent = reservas.filter(r => r.status === 'CONCLUIDA').reduce((s, r) => s + r.price, 0)
      const active = reservas.filter(r => r.status === 'PROXIMA' || r.status === 'EM_ANDAMENTO').length
      const avgRegionPrice = avgPrice._avg.pricePerDay ? Math.round(avgPrice._avg.pricePerDay) : null
      res.json({ totalSpent, totalReservas: reservas.length, activeReservas: active, petCount, avgRegionPrice })
    } else {
      const host = await hostRepository.findByUserId(userId)
      if (!host) return res.json({ totalEarned: 0, hostings: 0, rating: 0, petsAttended: 0 })

      const reservas = await prisma.reserva.findMany({ where: { hostId: host.id } })
      const concluded = reservas.filter(r => r.status === 'CONCLUIDA')
      const totalEarned = concluded.reduce((s, r) => s + r.price, 0)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEarned = concluded
        .filter(r => new Date(r.startDate) >= monthStart)
        .reduce((s, r) => s + r.price, 0)

      res.json({
        totalEarned,
        monthEarned,
        hostings: concluded.length,
        activeHostings: reservas.filter(r => r.status === 'PROXIMA' || r.status === 'EM_ANDAMENTO').length,
        rating: host.averageRating ?? 0,
        reviewCount: host.reviewCount ?? 0,
        petsAttended: concluded.length,
      })
    }
  } catch (err) { next(err) }
})

router.get('/financeiro/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const role = req.user!.role

    if (role === 'TUTOR') {
      const reservas = await prisma.reserva.findMany({
        where: { tutorId: userId },
        include: { host: { include: { user: { select: { name: true } } } }, pet: { select: { name: true } } },
        orderBy: { startDate: 'desc' },
        take: 20,
      })
      const transactions = reservas.map(r => ({
        id: r.id,
        type: 'expense',
        description: `Hospedagem — ${r.pet.name}`,
        hostName: r.host.user.name,
        amount: r.price,
        date: r.startDate,
        status: r.status,
      }))
      res.json(transactions)
    } else {
      const host = await hostRepository.findByUserId(userId)
      if (!host) return res.json([])

      const reservas = await prisma.reserva.findMany({
        where: { hostId: host.id, status: 'CONCLUIDA' },
        include: { pet: { select: { name: true } }, tutor: { select: { name: true } } },
        orderBy: { startDate: 'desc' },
        take: 20,
      })
      const transactions = reservas.map(r => ({
        id: r.id,
        type: 'income',
        description: `Hospedagem — ${r.pet.name}`,
        tutorName: r.tutor.name,
        amount: r.price,
        date: r.startDate,
        status: r.status,
      }))
      res.json(transactions)
    }
  } catch (err) { next(err) }
})

export default router
