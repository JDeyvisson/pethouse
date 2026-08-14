import { prisma } from '../lib/prisma'
import type { PetInput } from '../schemas/pet.schema'

export const petRepository = {
  findByOwner: (ownerId: string) =>
    prisma.pet.findMany({ where: { ownerId }, orderBy: { createdAt: 'desc' } }),

  findById: (id: string) =>
    prisma.pet.findUnique({ where: { id } }),

  create: (ownerId: string, data: PetInput, photoUrl?: string) =>
    prisma.pet.create({ data: { ...data, ownerId, photoUrl } }),

  update: (id: string, data: Partial<PetInput> & { photoUrl?: string }) =>
    prisma.pet.update({ where: { id }, data }),

  delete: (id: string) =>
    prisma.pet.delete({ where: { id } }),
}
