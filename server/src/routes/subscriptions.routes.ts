import { Router, Request, Response, NextFunction } from 'express'
import { verifyToken } from '../middleware/auth'
import { subscriptionRepository } from '../repositories/subscription.repository'

const router = Router()
router.use(verifyToken)

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await subscriptionRepository.findByUser(req.user!.sub)
    const active = sub ? sub.endDate > new Date() : false
    res.json({ active, endDate: sub?.endDate ?? null, startDate: sub?.startDate ?? null, plan: sub?.plan ?? null })
  } catch (err) { next(err) }
})

router.post('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)
    const sub = await subscriptionRepository.upsert(req.user!.sub, endDate)
    res.json({ active: true, endDate: sub.endDate, startDate: sub.startDate, plan: sub.plan })
  } catch (err) { next(err) }
})

export default router
