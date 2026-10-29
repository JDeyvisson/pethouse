import { reviewRepository } from '../repositories/review.repository'
import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'

export const reviewService = {
  async listByHost(hostId: string) {
    const reviews = await reviewRepository.findByHost(hostId)
    return reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      tutorName: r.tutor.name,
      createdAt: r.createdAt,
    }))
  },

  async listByTutor(tutorId: string) {
    const reviews = await reviewRepository.findByTutor(tutorId)
    return reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      sitterName: r.host.user.name,
      petName: r.reserva?.pet.name ?? '',
      service: r.reserva?.service ?? 'Hospedagem',
      createdAt: r.createdAt,
    }))
  },

  async listReceived(userId: string) {
    const reviews = await reviewRepository.findByHostProfileUser(userId)
    return reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      tutorName: r.tutor.name,
      createdAt: r.createdAt,
    }))
  },

  async create(tutorId: string, input: { hostId: string; reservaId?: string; rating: number; comment: string }) {
    if (!input.reservaId) throw new AppError('RESERVA_REQUIRED', 'Selecione uma reserva concluída')
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.hostId}, 2))::text`
      const reserva = await tx.reserva.findUnique({ where: { id: input.reservaId } })
      if (!reserva || reserva.tutorId !== tutorId || reserva.hostId !== input.hostId) throw new AppError('FORBIDDEN', 'Reserva não pertence ao tutor e anfitrião informados', 403)
      if (reserva.status !== 'CONCLUIDA') throw new AppError('INVALID_STATUS', 'Avalie apenas reservas concluídas')
      const review = await tx.review.create({ data: { rating: input.rating, comment: input.comment, tutorId, hostId: reserva.hostId, reservaId: reserva.id } })
      const aggregate = await tx.review.aggregate({ where: { hostId: reserva.hostId }, _avg: { rating: true }, _count: { id: true } })
      await tx.hostProfile.update({ where: { id: reserva.hostId }, data: { averageRating: aggregate._avg.rating, reviewCount: aggregate._count.id } })
      return review
    })
  },
}
