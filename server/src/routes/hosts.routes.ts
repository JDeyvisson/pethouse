import { prisma } from '../lib/prisma'
import { AppError } from '../middleware/error'
import { Router } from 'express'
import { hostController } from '../controllers/host.controller'
import { verifyToken } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import { upload } from '../middleware/upload'

const router = Router()

const hostUpload = upload.fields([
  { name: 'spacePhotos', maxCount: 5 },
  { name: 'housePhotos', maxCount: 10 },
  { name: 'docPhoto', maxCount: 1 },
])

// Authenticated own-profile routes MUST come before /:id to avoid `me` being captured as a param
router.get('/me', verifyToken, requireRole('CUIDADOR'), hostController.getMe)
router.put('/me', verifyToken, requireRole('CUIDADOR'), hostUpload, hostController.update)
router.delete('/me/photos/:filename', verifyToken, requireRole('CUIDADOR'), async (req, res, next) => {
  try {
    const host = await prisma.hostProfile.findUnique({ where: { userId: req.user.sub } })
    if (!host) throw new AppError('NOT_FOUND', 'Perfil não encontrado', 404)
    const url = '/uploads/' + req.params.filename
    if (![...host.housePhotos, ...host.spacePhotos].includes(url)) throw new AppError('NOT_FOUND', 'Foto não encontrada', 404)
    await prisma.hostProfile.update({ where: { id: host.id }, data: { housePhotos: host.housePhotos.filter(p => p !== url), spacePhotos: host.spacePhotos.filter(p => p !== url) } })
    res.sendStatus(204)
  } catch (err) { next(err) }
})
router.post('/', verifyToken, requireRole('CUIDADOR'), hostUpload, hostController.create)

// Public
router.get('/', hostController.list)
router.get('/:id', hostController.getById)

export default router
