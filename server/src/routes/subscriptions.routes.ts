import { mockServices } from '../lib/mock'
import { Router, Request, Response, NextFunction } from 'express'
import { verifyToken } from '../middleware/auth'
import { subscriptionRepository } from '../repositories/subscription.repository'

const router = Router()
router.use(verifyToken)

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await subscriptionRepository.findByUser(req.user!.sub)
    const active = mockServices() && !!sub && sub.endDate > new Date()
    res.json({ active, endDate: sub?.endDate ?? null, startDate: sub?.startDate ?? null, plan: sub?.plan ?? null })
  } catch (err) { next(err) }
})

router.post('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (mockServices()) {
      const endDate = new Date(Date.now() + 30 * 86400000)
      const sub = await subscriptionRepository.upsert(req.user!.sub, endDate)
      return res.json({ active: true, mock: true, endDate: sub.endDate, startDate: sub.startDate, plan: 'DEMONSTRACAO' })
    }
    res.status(503).json({ error: { code: 'PAYMENTS_UNAVAILABLE', message: 'Assinaturas indisponíveis. Nenhuma cobrança foi realizada.' } })
  } catch (err) { next(err) }
})

export default router
