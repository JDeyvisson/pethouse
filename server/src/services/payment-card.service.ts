import { paymentCardRepository } from '../repositories/payment-card.repository'
import { AppError } from '../middleware/error'

export const paymentCardService = {
  list: (userId: string) => paymentCardRepository.findByUser(userId),

  create: (userId: string, data: { brand: string; last4: string; expiry: string; holder?: string }) =>
    paymentCardRepository.create({ ...data, userId }),

  async remove(id: string, userId: string) {
    const card = await paymentCardRepository.findById(id)
    if (!card) throw new AppError('NOT_FOUND', 'Cartão não encontrado', 404)
    if (card.userId !== userId) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    return paymentCardRepository.delete(id)
  },
}
