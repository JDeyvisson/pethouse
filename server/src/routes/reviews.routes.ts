import { Router } from 'express'
import { reviewController } from '../controllers/review.controller'
import { verifyToken } from '../middleware/auth'
import { requireRole } from '../middleware/role'

const router = Router()

router.get('/mine', verifyToken, reviewController.mine)
router.get('/received', verifyToken, reviewController.received)
router.get('/:hostId', reviewController.list)
router.post('/', verifyToken, requireRole('TUTOR'), reviewController.create)

export default router
