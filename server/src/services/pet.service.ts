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

  create: (ownerId: string, data: PetInput, photoUrl?: string) =>
    petRepository.create(ownerId, data, photoUrl),

  async update(id: string, ownerId: string, data: Partial<PetInput>, photoUrl?: string) {
    const pet = await petRepository.findById(id)
    if (!pet) throw new AppError('PET_NOT_FOUND', 'Pet não encontrado', 404)
    if (pet.ownerId !== ownerId) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    return petRepository.update(id, { ...data, ...(photoUrl ? { photoUrl } : {}) })
  },

  async remove(id: string, ownerId: string) {
    const pet = await petRepository.findById(id)
    if (!pet) throw new AppError('PET_NOT_FOUND', 'Pet não encontrado', 404)
    if (pet.ownerId !== ownerId) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    return petRepository.delete(id)
  },
}
