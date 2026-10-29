import { validateCep } from './address.service'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { userRepository } from '../repositories/user.repository'
import { AppError } from '../middleware/error'
import type { RegisterInput, LoginInput } from '../schemas/auth.schema'

function signToken(id: string, role: string, version: number) {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn']
  return jwt.sign({ sub: id, role, version }, process.env.JWT_SECRET!, { expiresIn })
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email)
    if (existing) throw new AppError('EMAIL_IN_USE', 'E-mail já cadastrado', 409)

    if (input.cep) await validateCep(input.cep)
    const password = await bcrypt.hash(input.password, 10)
    const { acceptedTerms, ...data } = input
    const user = await userRepository.create({ ...data, password, termsAcceptedAt: new Date() })
    const token = signToken(user.id, user.role, user.tokenVersion)
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email)
    if (!user) throw new AppError('INVALID_CREDENTIALS', 'E-mail ou senha inválidos', 401)

    const valid = await bcrypt.compare(input.password, user.password)
    if (!valid) throw new AppError('INVALID_CREDENTIALS', 'E-mail ou senha inválidos', 401)

    const token = signToken(user.id, user.role, user.tokenVersion)
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } }
  },
}
