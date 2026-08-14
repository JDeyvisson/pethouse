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
    if (input.rating < 1 || input.rating > 5) {
      throw new AppError('INVALID_RATING', 'Rating deve ser entre 1 e 5', 400)
    }

    if (input.reservaId) {
      const reserva = await prisma.reserva.findUnique({ where: { id: input.reservaId } })
      if (!reserva || reserva.tutorId !== tutorId) {
        throw new AppError('FORBIDDEN', 'Reserva não encontrada ou não pertence a você', 403)
      }
      if (reserva.status !== 'CONCLUIDA') {
        throw new AppError('INVALID_STATUS', 'Só é possível avaliar reservas concluídas', 400)
      }
      const existing = await reviewRepository.findByReserva(input.reservaId)
      if (existing) {
        throw new AppError('ALREADY_REVIEWED', 'Esta reserva já foi avaliada', 409)
      }
    }

    const review = await reviewRepository.create({ ...input, tutorId })
    await reviewRepository.updateHostStats(input.hostId)
    return review
  },
}
