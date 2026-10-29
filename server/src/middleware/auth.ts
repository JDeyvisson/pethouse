import { prisma } from '../lib/prisma'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './error'

export interface JwtPayload {
  version?: number
  sub: string
  role: 'TUTOR' | 'CUIDADOR'
}

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload
    }
  }
}

export async function verifyToken(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next(new AppError('UNAUTHORIZED', 'Token não fornecido', 401)); return
  }
  const token = header.slice(7)
  let payload: JwtPayload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    if (typeof payload.sub !== 'string' || !['TUTOR', 'CUIDADOR'].includes(payload.role)) throw new Error('Invalid claims')
  } catch {
    next(new AppError('UNAUTHORIZED', 'Token inválido ou expirado', 401)); return
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || user.tokenVersion !== (payload.version ?? 0) || user.role !== payload.role) {
      next(new AppError('UNAUTHORIZED', 'Sessão encerrada. Faça login novamente.', 401)); return
    }
    req.user = payload
    next()
  } catch (err) { next(err) }
}
