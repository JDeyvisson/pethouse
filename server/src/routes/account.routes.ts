import { Router } from 'express'
import { z } from 'zod'
import { randomBytes, createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { mockServices } from '../lib/mock'
import { verifyToken } from '../middleware/auth'
import { AppError } from '../middleware/error'

const router = Router()
const password = z.string().min(8).max(72)
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
router.get('/capabilities', (_req, res) => res.json({ mock: mockServices(), email: mockServices(), payments: mockServices() }))
router.post('/request-email', async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().trim().toLowerCase().email(), purpose: z.enum(['reset', 'verify']) }).parse(req.body)
    if (!mockServices()) throw new AppError('EMAIL_UNAVAILABLE', 'Envio de e-mail indisponível no momento.', 503)
    const user = await prisma.user.findFirst({ where: { email: { equals: input.email, mode: 'insensitive' } } })
    const message = 'Modo demonstração: nenhum e-mail real foi enviado.'
    if (!user) return res.json({ mock: true, message })
    const recent = await prisma.authToken.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60000) } } })
    if (recent) throw new AppError('RATE_LIMIT', 'Aguarde um minuto antes de solicitar novamente.', 429)
    const token = randomBytes(32).toString('hex')
    await prisma.authToken.create({ data: { userId: user.id, hash: digest(token), purpose: input.purpose, expiresAt: new Date(Date.now() + 30 * 60000) } })
    // Returned only in explicit local mock mode. Never log or send this preview.
    res.json({ mock: true, message, previewPath: `/conta?purpose=${input.purpose}&token=${token}` })
  } catch (err) { next(err) }
})
router.post('/consume-email', async (req, res, next) => {
  try {
    if (!mockServices()) throw new AppError('EMAIL_UNAVAILABLE', 'Envio de e-mail indisponível.', 503)
    const input = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/), password: password.optional() }).parse(req.body)
    const hash = input.password ? await bcrypt.hash(input.password, 10) : undefined
    await prisma.$transaction(async tx => {
      const token = await tx.authToken.findUnique({ where: { hash: digest(input.token) } })
      if (!token || token.usedAt || token.expiresAt <= new Date()) throw new AppError('INVALID_TOKEN', 'Link inválido ou expirado')
      if (token.purpose === 'reset' && !hash) throw new AppError('PASSWORD_REQUIRED', 'Informe a nova senha')
      const used = await tx.authToken.updateMany({ where: { id: token.id, usedAt: null, expiresAt: { gt: new Date() } }, data: { usedAt: new Date() } })
      if (!used.count) throw new AppError('INVALID_TOKEN', 'Link já utilizado')
      if (token.purpose === 'reset') await tx.user.update({ where: { id: token.userId }, data: { password: hash, tokenVersion: { increment: 1 } } })
      // A mock verification must never claim real ownership of an email address.
    })
    res.json({ mock: true, message: input.password ? 'Senha alterada no ambiente de demonstração. Faça login novamente.' : 'Fluxo de verificação demonstrado. A posse do e-mail não foi verificada.' })
  } catch (err) { next(err) }
})
router.post('/change-password', verifyToken, async (req, res, next) => {
  try {
    const input = z.object({ currentPassword: z.string().max(72), password }).parse(req.body)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user.sub } })
    if (!await bcrypt.compare(input.currentPassword, user.password)) throw new AppError('INVALID_PASSWORD', 'Senha atual incorreta')
    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(input.password, 10), tokenVersion: { increment: 1 } } })
    res.json({ message: 'Senha alterada. Faça login novamente.' })
  } catch (err) { next(err) }
})
export default router
