import { prisma } from '../lib/prisma'

export const messageRepository = {
  findByReserva: (reservaId: string) =>
    prisma.message.findMany({
      where: { reservaId },
      include: { sender: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    }),

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
