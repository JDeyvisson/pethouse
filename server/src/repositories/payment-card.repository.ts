import { prisma } from '../lib/prisma'

export const paymentCardRepository = {
  findByUser: (userId: string) =>
    prisma.paymentCard.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),

  findById: (id: string) =>
    prisma.paymentCard.findUnique({ where: { id } }),

  create: (data: { brand: string; last4: string; expiry: string; holder?: string; userId: string }) =>
    prisma.paymentCard.create({ data }),

  delete: (id: string) =>
    prisma.paymentCard.delete({ where: { id } }),
}
