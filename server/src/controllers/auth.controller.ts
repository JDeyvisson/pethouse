import { Request, Response, NextFunction } from 'express'
import { registerSchema, loginSchema } from '../schemas/auth.schema'
import { authService } from '../services/auth.service'

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input = registerSchema.parse(req.body)
      const result = await authService.register(input)
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = loginSchema.parse(req.body)
      const result = await authService.login(input)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
}
