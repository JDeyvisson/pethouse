import { Router } from 'express'
import { reservaController } from '../controllers/reserva.controller'
import { verifyToken } from '../middleware/auth'

const router = Router()

router.use(verifyToken)

router.get('/', reservaController.list)
router.post('/', reservaController.create)
router.patch('/:id/cancel', reservaController.cancel)
router.patch('/:id/start', reservaController.start)
router.patch('/:id/conclude', reservaController.conclude)

export default router
