import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { paymentCardService } from '../services/payment-card.service'

const createSchema = z.object({
  brand: z.string().min(1),
  last4: z.string().length(4),
  expiry: z.string().min(4),
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
