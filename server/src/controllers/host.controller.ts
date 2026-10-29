import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'
import { hostSchema } from '../schemas/host.schema'
import { hostService } from '../services/host.service'

function fileUrls(files: Express.Multer.File[]) {
  return files.map(f => `/uploads/${f.filename}`)
}

export const hostController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { city, size, species, housingType, offset } = z.object({ city: z.string().max(100).optional(), size: z.string().max(50).optional(), species: z.string().max(50).optional(), housingType: z.string().max(50).optional(), offset: z.coerce.number().int().min(0).max(100000).default(0) }).parse(req.query)
      const hosts = await hostService.list({ city, size, species, housingType, offset })
      res.json(hosts)
    } catch (err) { next(err) }
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const host = await hostService.getMe(req.user!.sub)
      res.json(host)
    } catch (err) { next(err) }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const host = await hostService.getById(req.params.id)
      res.json(host)
    } catch (err) { next(err) }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = hostSchema.parse(req.body)
      const allFiles = (req.files as Record<string, Express.Multer.File[]>) ?? {}
      const spacePhotos = fileUrls(allFiles['spacePhotos'] ?? [])
      const housePhotos = fileUrls(allFiles['housePhotos'] ?? [])
      const docFile = (allFiles['docPhoto'] ?? [])[0]
      const docPhotoUrl = docFile ? `/private-documents/${docFile.filename}` : undefined
      const host = await hostService.create(req.user!.sub, input, spacePhotos, housePhotos, docPhotoUrl)
      res.status(201).json(host)
    } catch (err) { next(err) }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const input = hostSchema.partial().parse(req.body)
      const allFiles = (req.files as Record<string, Express.Multer.File[]>) ?? {}
      const spacePhotos = fileUrls(allFiles['spacePhotos'] ?? [])
      const housePhotos = fileUrls(allFiles['housePhotos'] ?? [])
      const docFile = (allFiles['docPhoto'] ?? [])[0]
      const docPhotoUrl = docFile ? `/private-documents/${docFile.filename}` : undefined
      const host = await hostService.update(req.user!.sub, input, spacePhotos, housePhotos, docPhotoUrl)
      res.json(host)
    } catch (err) { next(err) }
  },
}
