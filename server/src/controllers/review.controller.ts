import { Request, Response, NextFunction } from 'express'
import { reviewService } from '../services/review.service'

export const reviewController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.listByHost(req.params.hostId)
      res.json(reviews)
    } catch (err) { next(err) }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await reviewService.create(req.user!.sub, req.body)
      res.status(201).json(review)
    } catch (err) { next(err) }
  },

  async mine(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.listByTutor(req.user!.sub)
      res.json(reviews)
    } catch (err) { next(err) }
  },

  async received(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await reviewService.listReceived(req.user!.sub)
      res.json(reviews)
    } catch (err) { next(err) }
  },
}
