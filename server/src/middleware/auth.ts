import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from './error'

export interface JwtPayload {
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

export function verifyToken(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Token não fornecido', 401)
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    req.user = payload
    next()
  } catch {
    throw new AppError('UNAUTHORIZED', 'Token inválido ou expirado', 401)
  }
}
