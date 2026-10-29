import { prisma } from '../lib/prisma'
import { petService } from '../services/pet.service'
import { Router } from 'express'
import { petController } from '../controllers/pet.controller'
import { verifyToken } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import { upload } from '../middleware/upload'

const router = Router()

router.use(verifyToken)
router.use(requireRole('TUTOR'))

router.get('/', petController.list)
router.get('/:id', petController.getById)
router.post('/', upload.single('photo'), petController.create)
router.put('/:id', upload.single('photo'), petController.update)
router.delete('/:id/photo', async (req, res, next) => {
  try { await petService.getById(req.params.id, req.user.sub); await prisma.pet.update({ where: { id: req.params.id }, data: { photoUrl: null } }); res.sendStatus(204) } catch (err) { next(err) }
})
router.delete('/:id', petController.remove)

export default router
