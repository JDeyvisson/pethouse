import { publicHostSelect } from './host.repository'
import { ReservaStatus } from '@prisma/client'
import { AppError } from '../middleware/error'
import { prisma } from '../lib/prisma'
import type { ReservaInput } from '../schemas/reserva.schema'

export const reservaRepository = {
  findByTutor: (tutorId: string) =>
    prisma.reserva.findMany({
      where: { tutorId },
      include: {
        pet: true,
        host: { select: publicHostSelect },
      },
      orderBy: { startDate: 'desc' },
    }),

  findByHost: (hostId: string) =>
    prisma.reserva.findMany({
      where: { hostId },
      include: {
        pet: true,
        tutor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startDate: 'desc' },
    }),

  findById: (id: string) =>
    prisma.reserva.findUnique({ where: { id } }),

  updateStatus: async (id: string, status: ReservaStatus, expected: ReservaStatus) => {
    const result = await prisma.reserva.updateMany({ where: { id, status: expected }, data: { status } })
    if (!result.count) throw new AppError('STATUS_CONFLICT', 'A reserva foi alterada. Atualize a página.', 409)
    return prisma.reserva.findUniqueOrThrow({ where: { id } })
  },
}
