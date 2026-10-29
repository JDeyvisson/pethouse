import { prisma } from '../lib/prisma'
import { checkConditions } from '../schemas/conditions'
import { petRepository } from '../repositories/pet.repository'
import { AppError } from '../middleware/error'
import type { PetInput } from '../schemas/pet.schema'

export const petService = {
  list: (ownerId: string) => petRepository.findByOwner(ownerId),

  async getById(id: string, ownerId: string) {
    const pet = await petRepository.findById(id)
    if (!pet) throw new AppError('PET_NOT_FOUND', 'Pet não encontrado', 404)
    if (pet.ownerId !== ownerId) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    return pet
  },

  create: async (ownerId: string, data: PetInput, photoUrl?: string) =>
    {
      checkConditions(data, 'pet')
      if (data.requestKey) {
        const existing = await prisma.pet.findUnique({ where: { requestKey: data.requestKey } })
        if (existing) {
          if (existing.ownerId !== ownerId || Object.entries(data).some(([key, value]) => value !== undefined && JSON.stringify(value) !== JSON.stringify(existing[key as keyof typeof existing]))) throw new AppError('IDEMPOTENCY_CONFLICT', 'Solicitação já utilizada', 409)
          return existing
        }
      }
      return petRepository.create(ownerId, data, photoUrl)
    },

  async update(id: string, ownerId: string, data: Partial<PetInput>, photoUrl?: string) {
    const pet = await petRepository.findById(id)
    if (!pet) throw new AppError('PET_NOT_FOUND', 'Pet não encontrado', 404)
    if (pet.ownerId !== ownerId) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    if (data.requestKey && data.requestKey !== pet.requestKey) throw new AppError('INVALID_KEY', 'Identificador da solicitação não pode ser alterado')
    checkConditions({ ...pet, ...data }, 'pet')
    return petRepository.update(id, { ...data, ...(photoUrl ? { photoUrl } : {}) })
  },

  async remove(id: string, ownerId: string) {
    const pet = await petRepository.findById(id)
    if (!pet) throw new AppError('PET_NOT_FOUND', 'Pet não encontrado', 404)
    if (pet.ownerId !== ownerId) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    return petRepository.delete(id)
  },
}
