import { Request, Response, NextFunction } from 'express'
import { AppError } from './error'

export function requireRole(...roles: ('TUTOR' | 'CUIDADOR')[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError('FORBIDDEN', 'Acesso não autorizado para este perfil', 403)
    }
    next()
  }
}
