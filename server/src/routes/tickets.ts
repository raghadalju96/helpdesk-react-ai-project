import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import prisma from '../db'

const router = Router()

router.get('/tickets', requireAuth, async (_req, res) => {
  const tickets = await prisma.ticket.findMany({
    select: {
      id: true,
      subject: true,
      fromEmail: true,
      fromName: true,
      status: true,
      category: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ tickets })
})

export default router
