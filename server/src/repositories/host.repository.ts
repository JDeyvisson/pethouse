import { prisma } from '../lib/prisma'
import type { HostInput } from '../schemas/host.schema'

const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const hostRepository = {
  findAll: async (filters: { city?: string; size?: string; species?: string; housingType?: string }) => {
    const where: Record<string, unknown> = {}
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' }
    if (filters.housingType) where.housingType = filters.housingType

    const hosts = await prisma.hostProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { averageRating: 'desc' },
    })

    // acceptedSizes/acceptedSpecies are free-form strings entered across different
    // forms (e.g. "Pequeno" vs "pequeno"), so match case/accent-insensitively
    // instead of relying on Prisma's exact `has` comparison.
    return hosts.filter(h => {
      const sizeOk = !filters.size ||
        h.acceptedSizes.some(s => normalize(s).startsWith(normalize(filters.size!)))
      const speciesOk = !filters.species ||
        h.acceptedSpecies.some(s => normalize(s).startsWith(normalize(filters.species!)))
      return sizeOk && speciesOk
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
