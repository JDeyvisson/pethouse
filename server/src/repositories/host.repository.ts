import { prisma } from '../lib/prisma'
import type { HostInput } from '../schemas/host.schema'

export const hostRepository = {
  findAll: (filters: { city?: string; size?: string; species?: string; housingType?: string }) => {
    const where: Record<string, unknown> = {}
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' }
    if (filters.housingType) where.housingType = filters.housingType
    if (filters.size) where.acceptedSizes = { has: filters.size }
    if (filters.species) where.acceptedSpecies = { has: filters.species }
    return prisma.hostProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { averageRating: 'desc' },
    })
  },

  findById: (id: string) =>
    prisma.hostProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    }),

  findByUserId: (userId: string) =>
    prisma.hostProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    }),

  create: (userId: string, data: HostInput, spacePhotos: string[], housePhotos: string[], docPhotoUrl?: string) =>
    prisma.hostProfile.create({
      data: { ...data, userId, spacePhotos, housePhotos, docPhotoUrl: docPhotoUrl ?? null },
    }),

  update: (userId: string, data: Partial<HostInput> & { spacePhotos?: string[]; housePhotos?: string[]; docPhotoUrl?: string }) =>
    prisma.hostProfile.update({ where: { userId }, data }),
}
