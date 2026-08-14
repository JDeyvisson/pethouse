import { prisma } from '../lib/prisma'
import type { ReservaInput } from '../schemas/reserva.schema'

export const reservaRepository = {
  findByTutor: (tutorId: string) =>
    prisma.reserva.findMany({
      where: { tutorId },
      include: {
        pet: true,
        host: { include: { user: { select: { id: true, name: true } } } },
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

  create: (data: ReservaInput & { tutorId: string; service?: string }) =>
    prisma.reserva.create({ data: { ...data, status: 'PROXIMA' } }),

  updateStatus: (id: string, status: string) =>
    prisma.reserva.update({ where: { id }, data: { status: status as never } }),
}
