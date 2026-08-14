import { Router, Request, Response, NextFunction } from 'express'
import { verifyToken } from '../middleware/auth'
import { messageRepository } from '../repositories/message.repository'
import { AppError } from '../middleware/error'

const router = Router()
router.use(verifyToken)

router.get('/:reservaId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ok = await messageRepository.canAccess(req.params.reservaId, req.user!.sub)
    if (!ok) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    const msgs = await messageRepository.findByReserva(req.params.reservaId)
    res.json(msgs)
  } catch (err) { next(err) }
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reservaId, text } = req.body as { reservaId?: string; text?: string }
    if (!reservaId || !text?.trim()) throw new AppError('INVALID_INPUT', 'reservaId e text são obrigatórios', 400)
    const ok = await messageRepository.canAccess(reservaId, req.user!.sub)
    if (!ok) throw new AppError('FORBIDDEN', 'Acesso negado', 403)
    const msg = await messageRepository.create(reservaId, req.user!.sub, text.trim())
    res.status(201).json(msg)
  } catch (err) { next(err) }
})

export default router
