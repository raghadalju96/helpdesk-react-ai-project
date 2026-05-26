import { Router } from 'express'
import prisma from '../db'

const router = Router()

router.post('/email', async (req, res) => {
  const secret = process.env.WEBHOOK_SECRET
  if (secret) {
    const provided = req.headers['x-webhook-secret']
    if (provided !== secret) {
      res.status(401).json({ error: 'Invalid webhook secret' })
      return
    }
  }

  const { from, from_name, subject, body_plain, body_html } = req.body

  if (!from || typeof from !== 'string') {
    res.status(400).json({ error: 'Field "from" is required' })
    return
  }
  if (!from_name || typeof from_name !== 'string') {
    res.status(400).json({ error: 'Field "from_name" is required' })
    return
  }
  if (!subject || typeof subject !== 'string') {
    res.status(400).json({ error: 'Field "subject" is required' })
    return
  }
  if (!body_plain || typeof body_plain !== 'string') {
    res.status(400).json({ error: 'Field "body_plain" is required' })
    return
  }

  const ticket = await prisma.ticket.create({
    data: {
      fromEmail: from.trim().toLowerCase(),
      fromName: String(from_name).trim(),
      subject: subject.trim(),
      body: body_plain,
      bodyHtml: body_html ? String(body_html) : null,
    },
    select: { id: true, subject: true, status: true, createdAt: true },
  })

  res.status(200).json({ ticket })
})

export default router
