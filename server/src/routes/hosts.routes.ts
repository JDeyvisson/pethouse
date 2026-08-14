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
router.post('/', verifyToken, requireRole('CUIDADOR'), hostUpload, hostController.create)

// Public
router.get('/', hostController.list)
router.get('/:id', hostController.getById)

export default router
