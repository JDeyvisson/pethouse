import { prisma } from '../lib/prisma'
import { validateCep } from './address.service'
import { checkConditions } from '../schemas/conditions'
import { hostRepository } from '../repositories/host.repository'
import { AppError } from '../middleware/error'
import type { HostInput } from '../schemas/host.schema'

export const hostService = {
  list: (filters: { city?: string; size?: string; species?: string; housingType?: string; offset?: number }) =>
    hostRepository.findAll(filters),

  getById: async (id: string) => {
    const host = await hostRepository.findById(id)
    if (!host) throw new AppError('HOST_NOT_FOUND', 'Anfitrião não encontrado', 404)
    return host
  },

  getMe: async (userId: string) => {
    const host = await hostRepository.findByUserId(userId)
    if (!host) throw new AppError('HOST_NOT_FOUND', 'Perfil de anfitrião não encontrado', 404)
    return host
  },

  create: async (userId: string, data: HostInput, spacePhotos: string[], housePhotos: string[], docPhotoUrl?: string) => {
    checkConditions(data, 'host')
    await validateCep(data.cep)
    const existing = await hostRepository.findByUserId(userId)
    if (existing) throw new AppError('HOST_EXISTS', 'Perfil de anfitrião já cadastrado', 409)
    const { acceptedTerms, confirmsAccuracy, acceptsResponsibility, ...profile } = data
    return hostRepository.create(userId, { ...profile, termsAcceptedAt: new Date() }, spacePhotos, housePhotos, docPhotoUrl)
  },

  update: async (userId: string, data: Partial<HostInput>, spacePhotos?: string[], housePhotos?: string[], docPhotoUrl?: string) => {
    const existing = await hostRepository.findByUserId(userId)
    if (!existing) throw new AppError('HOST_NOT_FOUND', 'Cadastre seu espaço antes de editar', 404)
    checkConditions({ ...existing, ...data }, 'host')
    if (data.cep && data.cep !== existing.cep) await validateCep(data.cep)
    const { acceptedTerms, confirmsAccuracy, acceptsResponsibility, termsVersion, ...profile } = data
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${existing.id}, 0))::text`
      const current = await tx.hostProfile.findUniqueOrThrow({ where: { userId } })
      const dates = data.availableDates ?? current.availableDates
      const capacity = Number.parseInt(data.maxPets ?? current.maxPets, 10)
      const bookings = await tx.reserva.findMany({ where: { hostId: current.id, status: { in: ['PROXIMA', 'EM_ANDAMENTO'] } } })
      const occupancy = new Map<string, number>()
      for (const booking of bookings) {
        for (let day = Date.parse(booking.startDate.toISOString().slice(0, 10)); day < Date.parse(booking.endDate.toISOString().slice(0, 10)); day += 86400000) {
          const date = new Date(day).toISOString().slice(0, 10)
          occupancy.set(date, (occupancy.get(date) ?? 0) + 1)
        }
      }
      if ([...occupancy].some(([date, count]) => !dates.includes(date) || count > capacity))
        throw new AppError('ACTIVE_BOOKINGS', 'Mantenha as datas e vagas das reservas existentes', 409)
      return tx.hostProfile.update({ where: { userId }, data: {
      ...profile,
      ...(spacePhotos?.length ? { spacePhotos } : {}),
      ...(housePhotos?.length ? { housePhotos } : {}),
      ...(docPhotoUrl ? { docPhotoUrl } : {}),
      } })
    })
  },
}
