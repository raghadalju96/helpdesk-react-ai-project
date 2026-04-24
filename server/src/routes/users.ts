import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import prisma from '../db'

const router = Router()

router.get('/users', requireAuth, async (req, res) => {
  if (res.locals.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  res.json({ users })
})

export default router
