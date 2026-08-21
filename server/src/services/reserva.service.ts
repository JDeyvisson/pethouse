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
    const start = new Date(input.startDate)
    const end = new Date(input.endDate)
    if (end <= start) throw new AppError('INVALID_DATES', 'Data de término deve ser após a data de início', 400)
    return reservaRepository.create({ ...input, tutorId })
  },

  async cancel(id: string, tutorId: string) {
    const reserva = await reservaRepository.findById(id)
    if (!reserva) throw new AppError('RESERVA_NOT_FOUND', 'Reserva não encontrada', 404)
    if (reserva.tutorId !== tutorId) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    if (reserva.status === 'CANCELADA') throw new AppError('ALREADY_CANCELLED', 'Reserva já cancelada', 409)
    if (reserva.status === 'CONCLUIDA') throw new AppError('CONCLUDED', 'Não é possível cancelar uma reserva concluída', 409)
    return reservaRepository.updateStatus(id, 'CANCELADA')
  },

  async start(id: string, hostUserId: string) {
    const host = await hostRepository.findByUserId(hostUserId)
    if (!host) throw new AppError('HOST_NOT_FOUND', 'Perfil de anfitrião não encontrado', 404)
    const reserva = await reservaRepository.findById(id)
    if (!reserva) throw new AppError('RESERVA_NOT_FOUND', 'Reserva não encontrada', 404)
    if (reserva.hostId !== host.id) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    if (reserva.status !== 'PROXIMA') throw new AppError('INVALID_STATUS', 'Reserva não está como próxima', 409)
    return reservaRepository.updateStatus(id, 'EM_ANDAMENTO')
  },

  async conclude(id: string, hostUserId: string) {
    const host = await hostRepository.findByUserId(hostUserId)
    if (!host) throw new AppError('HOST_NOT_FOUND', 'Perfil de anfitrião não encontrado', 404)
    const reserva = await reservaRepository.findById(id)
    if (!reserva) throw new AppError('RESERVA_NOT_FOUND', 'Reserva não encontrada', 404)
    if (reserva.hostId !== host.id) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    if (reserva.status !== 'EM_ANDAMENTO') throw new AppError('INVALID_STATUS', 'Reserva não está em andamento', 409)
    return reservaRepository.updateStatus(id, 'CONCLUIDA')
  },
}
