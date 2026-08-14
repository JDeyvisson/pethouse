import { prisma } from '../lib/prisma'

export const reviewRepository = {
  findByHost(hostId: string) {
    return prisma.review.findMany({
      where: { hostId },
      include: { tutor: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
  },

  findByReserva(reservaId: string) {
    return prisma.review.findUnique({ where: { reservaId } })
  },

  findByTutor(tutorId: string) {
    return prisma.review.findMany({
      where: { tutorId },
      include: {
        host: { select: { id: true, user: { select: { name: true } } } },
        reserva: { select: { pet: { select: { name: true } }, service: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  findByHostProfileUser(userId: string) {
    return prisma.review.findMany({
      where: { host: { userId } },
      include: { tutor: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
  },

  create(data: { rating: number; comment: string; tutorId: string; hostId: string; reservaId?: string }) {
    return prisma.review.create({ data })
  },

  async updateHostStats(hostId: string) {
    const agg = await prisma.review.aggregate({
      where: { hostId },
      _avg: { rating: true },
      _count: { id: true },
    })
    return prisma.hostProfile.update({
      where: { id: hostId },
      data: {
        averageRating: agg._avg.rating ?? 0,
        reviewCount: agg._count.id,
      },
    })
  },
}
