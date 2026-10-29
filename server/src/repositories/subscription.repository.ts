import { prisma } from '../lib/prisma'

export const subscriptionRepository = {
  findByUser: (userId: string) =>
    prisma.subscription.findUnique({ where: { userId } }),

  upsert: (userId: string, endDate: Date) =>
    prisma.subscription.upsert({
      where: { userId },
      create: { userId, endDate, startDate: new Date(), plan: 'DEMONSTRACAO' },
      update: { endDate, startDate: new Date(), plan: 'DEMONSTRACAO' },
    }),
}
