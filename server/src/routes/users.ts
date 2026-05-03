import { Router } from 'express'
import { hashPassword } from 'better-auth/crypto'
import { requireAuth } from '../middleware/requireAuth'
import prisma from '../db'

const router = Router()

router.get('/users', requireAuth, async (req, res) => {
  if (res.locals.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  res.json({ users })
})

router.post('/users', requireAuth, async (req, res) => {
  if (res.locals.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const { name, email, password } = req.body

  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    res.status(400).json({ error: 'Name must be at least 3 characters' })
    return
  }
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required' })
    return
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'A user with this email already exists' })
    return
  }

  const userId = crypto.randomUUID()
  const user = await prisma.user.create({
    data: { id: userId, name: name.trim(), email, emailVerified: false },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  const hashed = await hashPassword(password)
  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: 'credential',
      userId,
      password: hashed,
    },
  })

  res.status(201).json({ user })
})

router.patch('/users/:id', requireAuth, async (req, res) => {
  if (res.locals.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const id = req.params.id as string
  const { name, email, password } = req.body

  if (!name || typeof name !== 'string' || name.trim().length < 3) {
    res.status(400).json({ error: 'Name must be at least 3 characters' })
    return
  }
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required' })
    return
  }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  if (email !== existing.email) {
    const emailConflict = await prisma.user.findUnique({ where: { email } })
    if (emailConflict) {
      res.status(409).json({ error: 'A user with this email already exists' })
      return
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: { name: name.trim(), email },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  if (password && typeof password === 'string' && password.length >= 8) {
    const hashed = await hashPassword(password)
    await prisma.account.updateMany({
      where: { userId: id, providerId: 'credential' },
      data: { password: hashed },
    })
  }

  res.json({ user })
})

router.delete('/users/:id', requireAuth, async (req, res) => {
  if (res.locals.user.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const id = req.params.id as string

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user || user.deletedAt !== null) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  if (user.role === 'admin') {
    res.status(403).json({ error: 'Admin users cannot be deleted' })
    return
  }

  await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  res.status(204).end()
})

export default router
