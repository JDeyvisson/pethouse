import { Router } from 'express'
import { paymentCardController } from '../controllers/payment-card.controller'
import { verifyToken } from '../middleware/auth'

const router = Router()

router.use(verifyToken)

router.get('/', paymentCardController.list)
router.post('/', paymentCardController.create)
router.delete('/:id', paymentCardController.remove)

export default router
