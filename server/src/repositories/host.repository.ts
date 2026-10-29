import { prisma } from '../lib/prisma'
import type { HostInput } from '../schemas/host.schema'

export const publicHostSelect = {
  id: true, city: true, housingType: true, fencedYard: true, spaceSize: true, spaceDesc: true,
  spacePhotos: true, housePhotos: true, hasOtherAnimals: true, otherAnimalsDesc: true,
  hasChildren: true, worksOutside: true, maxPets: true, acceptedSizes: true, acceptedSpecies: true,
  canAdminMeds: true, specialNeedsExp: true, hasHostedBefore: true, hostingTime: true, bio: true,
  pricePerDay: true, availableDates: true, averageRating: true, reviewCount: true,
  user: { select: { id: true, name: true } },
} as const

const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export const hostRepository = {
  findAll: async (filters: { city?: string; size?: string; species?: string; housingType?: string; offset?: number }) => {
    const where: Record<string, unknown> = {}
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' }
    if (filters.housingType) where.housingType = filters.housingType

    if (filters.size) where.acceptedSizes = { hasSome: ['Pequeno', 'Médio', 'Grande', 'Gigante', 'pequeno', 'medio', 'grande', 'gigante'].filter(v => normalize(v) === normalize(filters.size!)) }
    if (filters.species) where.acceptedSpecies = { hasSome: ['Cachorro', 'Gato', 'Ave', 'Pássaro', 'Coelho', 'Réptil', 'Roedor', 'Outro', 'cachorro', 'gato', 'passaro', 'coelho', 'outro'].filter(v => normalize(v).replace('passaro', 'ave') === normalize(filters.species!).replace('passaro', 'ave')) }
    const hosts = await prisma.hostProfile.findMany({
      where, skip: filters.offset ?? 0, take: 50,
      select: publicHostSelect,
      orderBy: [{ averageRating: 'desc' }, { id: 'asc' }],
    })

    // acceptedSizes/acceptedSpecies are free-form strings entered across different
    // forms (e.g. "Pequeno" vs "pequeno"), so match case/accent-insensitively
    // instead of relying on Prisma's exact `has` comparison.
    return hosts
  },

  findById: (id: string) =>
    prisma.hostProfile.findUnique({
      where: { id },
      select: publicHostSelect,
    }),

  findByUserId: (userId: string) =>
    prisma.hostProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    }),

  create: (userId: string, data: Omit<HostInput, 'acceptedTerms' | 'confirmsAccuracy' | 'acceptsResponsibility'> & { termsAcceptedAt: Date }, spacePhotos: string[], housePhotos: string[], docPhotoUrl?: string) =>
    prisma.hostProfile.create({
      data: { ...data, userId, spacePhotos, housePhotos, docPhotoUrl: docPhotoUrl ?? null },
    }),

  update: (userId: string, data: Partial<HostInput> & { spacePhotos?: string[]; housePhotos?: string[]; docPhotoUrl?: string }) =>
    prisma.hostProfile.update({ where: { userId }, data }),
}
