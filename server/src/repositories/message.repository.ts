import { prisma } from '../lib/prisma'

export const messageRepository = {
  findByReserva: async (reservaId: string, before?: string) =>
    (await prisma.message.findMany({
      where: { reservaId },
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
      take: 100,
      include: { sender: { select: { id: true, name: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    })).reverse(),

  create: (reservaId: string, senderId: string, text: string) =>
    prisma.message.create({
      data: { reservaId, senderId, text },
      include: { sender: { select: { id: true, name: true } } },
    }),

  canAccess: async (reservaId: string, userId: string): Promise<boolean> => {
    const reserva = await prisma.reserva.findFirst({
      where: {
        id: reservaId,
        OR: [
          { tutorId: userId },
          { host: { userId } },
        ],
      },
    })
    return reserva !== null
  },
}
