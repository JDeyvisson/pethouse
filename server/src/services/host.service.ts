import { hostRepository } from '../repositories/host.repository'
import { AppError } from '../middleware/error'
import type { HostInput } from '../schemas/host.schema'

export const hostService = {
  list: (filters: { city?: string; size?: string; species?: string; housingType?: string }) =>
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
    const existing = await hostRepository.findByUserId(userId)
    if (existing) throw new AppError('HOST_EXISTS', 'Perfil de anfitrião já cadastrado', 409)
    return hostRepository.create(userId, data, spacePhotos, housePhotos, docPhotoUrl)
  },

  update: (userId: string, data: Partial<HostInput>, spacePhotos?: string[], housePhotos?: string[], docPhotoUrl?: string) =>
    hostRepository.update(userId, {
      ...data,
      ...(spacePhotos?.length ? { spacePhotos } : {}),
      ...(housePhotos?.length ? { housePhotos } : {}),
      ...(docPhotoUrl ? { docPhotoUrl } : {}),
    }),
}
