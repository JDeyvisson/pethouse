import { Request, Response, NextFunction } from 'express'
import { reservaSchema } from '../schemas/reserva.schema'
import { reservaService } from '../services/reserva.service'

export const reservaController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const reservas = await reservaService.list(req.user!.sub, req.user!.role)
      res.json(reservas)
    } catch (err) { next(err) }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = reservaSchema.parse(req.body)
      const reserva = await reservaService.create(req.user!.sub, input)
      res.status(201).json(reserva)
    } catch (err) { next(err) }
  },

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const reserva = await reservaService.cancel(req.params.id, req.user!.sub)
      res.json(reserva)
    } catch (err) { next(err) }
  },
}
