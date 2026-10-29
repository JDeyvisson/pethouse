import { prisma } from '../lib/prisma'
import { bookingDays } from '../lib/booking'
import { normalizeOption, todayBrazil } from '../lib/rules'
import { reservaRepository } from '../repositories/reserva.repository'
import { hostRepository } from '../repositories/host.repository'
import { AppError } from '../middleware/error'
import type { ReservaInput } from '../schemas/reserva.schema'

export const reservaService = {
  async list(userId: string, role: string) {
    if (role === 'TUTOR') return reservaRepository.findByTutor(userId)

    const host = await hostRepository.findByUserId(userId)
    if (!host) throw new AppError('HOST_NOT_FOUND', 'Perfil de anfitrião não encontrado', 404)
    return reservaRepository.findByHost(host.id)
  },

  async create(tutorId: string, input: ReservaInput) {
    const start = new Date(new Date(input.startDate).toISOString().slice(0, 10) + 'T12:00:00.000Z')
    const end = new Date(new Date(input.endDate).toISOString().slice(0, 10) + 'T12:00:00.000Z')
    const days = bookingDays(start, end)
    // Serialize each host and pet: check availability after obtaining both locks.
    return prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.hostId}, 0))::text`
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.petId}, 1))::text`
      if (input.idempotencyKey) {
        const existing = await tx.reserva.findUnique({ where: { idempotencyKey: input.idempotencyKey } })
        if (existing) {
          if (existing.tutorId !== tutorId || existing.petId !== input.petId || existing.hostId !== input.hostId || existing.startDate.getTime() !== start.getTime() || existing.endDate.getTime() !== end.getTime())
            throw new AppError('IDEMPOTENCY_CONFLICT', 'Solicitação já utilizada', 409)
          return existing
        }
      }
      const pet = await tx.pet.findUnique({ where: { id: input.petId } })
      if (!pet || pet.ownerId !== tutorId) throw new AppError('FORBIDDEN', 'Pet não pertence a você', 403)
      const host = await tx.hostProfile.findUnique({ where: { id: input.hostId } })
      if (!host) throw new AppError('HOST_NOT_FOUND', 'Anfitrião não encontrado', 404)
      if (host.userId === tutorId) throw new AppError('INVALID_HOST', 'Não é possível reservar seu próprio espaço')
      if (!days.every(d => host.availableDates.includes(d))) throw new AppError('UNAVAILABLE', 'Há noites indisponíveis no período', 409)
      if (!host.acceptedSpecies.some(v => normalizeOption(v) === normalizeOption(pet.species)) || !host.acceptedSizes.some(v => normalizeOption(v) === normalizeOption(pet.size)))
        throw new AppError('INCOMPATIBLE_PET', 'O espaço não aceita a espécie ou o porte deste pet')
      const overlapping = await tx.reserva.findMany({ where: {
        status: { in: ['PROXIMA', 'EM_ANDAMENTO'] }, startDate: { lt: end }, endDate: { gt: start },
        OR: [{ hostId: host.id }, { petId: pet.id }],
      } })
      if (overlapping.some(r => r.petId === pet.id)) throw new AppError('PET_BUSY', 'O pet já possui reserva neste período', 409)
      const capacity = Number.parseInt(host.maxPets, 10)
      if (!Number.isFinite(capacity) || days.some(day => overlapping.filter(r => r.hostId === host.id && r.startDate.toISOString().slice(0, 10) <= day && r.endDate.toISOString().slice(0, 10) > day).length >= capacity))
        throw new AppError('FULL', 'O espaço está sem vagas neste período', 409)
      const price = Math.round(host.pricePerDay * 100) * days.length / 100
      if (!Number.isFinite(price) || price <= 0) throw new AppError('INVALID_PRICE', 'Preço do anfitrião indisponível')
      return tx.reserva.create({ data: { petId: pet.id, hostId: host.id, tutorId, startDate: start, endDate: end, price, idempotencyKey: input.idempotencyKey } })
    }, { timeout: 15000 })
  },

  async cancel(id: string, tutorId: string) {
    const reserva = await reservaRepository.findById(id)
    if (!reserva) throw new AppError('RESERVA_NOT_FOUND', 'Reserva não encontrada', 404)
    if (reserva.tutorId !== tutorId) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    if (reserva.status === 'EM_ANDAMENTO') throw new AppError('INVALID_STATUS', 'Hospedagem em andamento não pode ser cancelada', 409)
    if (reserva.status === 'CANCELADA') throw new AppError('ALREADY_CANCELLED', 'Reserva já cancelada', 409)
    if (reserva.status === 'CONCLUIDA') throw new AppError('CONCLUDED', 'Não é possível cancelar uma reserva concluída', 409)
    return reservaRepository.updateStatus(id, 'CANCELADA', 'PROXIMA')
  },

  async start(id: string, hostUserId: string) {
    const host = await hostRepository.findByUserId(hostUserId)
    if (!host) throw new AppError('HOST_NOT_FOUND', 'Perfil de anfitrião não encontrado', 404)
    const reserva = await reservaRepository.findById(id)
    if (!reserva) throw new AppError('RESERVA_NOT_FOUND', 'Reserva não encontrada', 404)
    if (reserva.hostId !== host.id) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    if (reserva.status !== 'PROXIMA') throw new AppError('INVALID_STATUS', 'Reserva não está como próxima', 409)
    if (reserva.startDate.toISOString().slice(0, 10) > todayBrazil() || reserva.endDate.toISOString().slice(0, 10) <= todayBrazil()) throw new AppError('INVALID_DATES', 'A hospedagem só pode iniciar durante o período reservado')
    return reservaRepository.updateStatus(id, 'EM_ANDAMENTO', 'PROXIMA')
  },

  async conclude(id: string, hostUserId: string) {
    const host = await hostRepository.findByUserId(hostUserId)
    if (!host) throw new AppError('HOST_NOT_FOUND', 'Perfil de anfitrião não encontrado', 404)
    const reserva = await reservaRepository.findById(id)
    if (!reserva) throw new AppError('RESERVA_NOT_FOUND', 'Reserva não encontrada', 404)
    if (reserva.hostId !== host.id) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    if (reserva.status !== 'EM_ANDAMENTO') throw new AppError('INVALID_STATUS', 'Reserva não está em andamento', 409)
    if (reserva.endDate.toISOString().slice(0, 10) > todayBrazil()) throw new AppError('INVALID_DATES', 'A hospedagem só pode ser concluída a partir do check-out')
    return reservaRepository.updateStatus(id, 'CONCLUIDA', 'EM_ANDAMENTO')
  },
}
