import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { paymentCardService } from '../services/payment-card.service'

const createSchema = z.object({
  brand: z.string().min(1),
  last4: z.string().regex(/^\d{4}$/, 'Informe quatro dígitos'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/AA').refine(v => { const [m, y] = v.split('/').map(Number); return new Date(2000 + y, m, 1) > new Date() }, 'Cartão vencido'),
  holder: z.string().optional(),
})

export const paymentCardController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const cards = await paymentCardService.list(req.user!.sub)
      res.json(cards)
    } catch (err) { next(err) }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createSchema.parse(req.body)
      const card = await paymentCardService.create(req.user!.sub, input)
      res.status(201).json(card)
    } catch (err) { next(err) }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await paymentCardService.remove(req.params.id, req.user!.sub)
      res.status(204).send()
    } catch (err) { next(err) }
  },
}
