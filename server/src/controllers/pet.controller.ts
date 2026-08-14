import { Request, Response, NextFunction } from 'express'
import { petSchema } from '../schemas/pet.schema'
import { petService } from '../services/pet.service'

export const petController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const pets = await petService.list(req.user!.sub)
      res.json(pets)
    } catch (err) { next(err) }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = petSchema.parse(req.body)
      const photoUrl = (req.file as Express.Multer.File | undefined)
        ? `/uploads/${(req.file as Express.Multer.File).filename}`
        : undefined
      const pet = await petService.create(req.user!.sub, input, photoUrl)
      res.status(201).json(pet)
    } catch (err) { next(err) }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const pet = await petService.getById(req.params.id, req.user!.sub)
      res.json(pet)
    } catch (err) { next(err) }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = petSchema.partial().parse(req.body)
      const photoUrl = (req.file as Express.Multer.File | undefined)
        ? `/uploads/${(req.file as Express.Multer.File).filename}`
        : undefined
      const pet = await petService.update(req.params.id, req.user!.sub, input, photoUrl)
      res.json(pet)
    } catch (err) { next(err) }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await petService.remove(req.params.id, req.user!.sub)
      res.status(204).send()
    } catch (err) { next(err) }
  },
}
