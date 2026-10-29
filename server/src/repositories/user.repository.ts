import { Role } from '@prisma/client'
import { prisma } from '../lib/prisma'

interface CreateUserData {
  termsVersion?: string
  termsAcceptedAt?: Date
  name: string
  email: string
  password: string
  role: Role
  phone?: string
  cep?: string
  street?: string
  addressNum?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
}

export const userRepository = {
  findByEmail: (email: string) =>
    prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: 'insensitive' } } }),

  findById: (id: string) =>
    prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, phone: true, city: true, state: true, createdAt: true },
    }),

  create: (data: CreateUserData) =>
    prisma.user.create({ data }),
}
