import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import prisma from '../db'
import { Prisma, TicketStatus, TicketCategory } from '../generated/prisma/client'

const router = Router()

const SORTABLE_COLUMNS = ['id', 'subject', 'fromEmail', 'fromName', 'status', 'category', 'createdAt'] as const
type SortableColumn = typeof SORTABLE_COLUMNS[number]

const VALID_STATUSES: TicketStatus[] = ['open', 'resolved', 'closed']
const VALID_CATEGORIES: TicketCategory[] = ['generalQuestion', 'technicalQuestion', 'refundRequest']

router.get('/tickets', requireAuth, async (req, res) => {
  const sortByParam = req.query.sortBy as string
  const sortBy: SortableColumn = (SORTABLE_COLUMNS as readonly string[]).includes(sortByParam)
    ? (sortByParam as SortableColumn)
    : 'createdAt'
  const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc'

  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const statusParam = req.query.status as string
  const categoryParam = req.query.category as string

  const status = VALID_STATUSES.includes(statusParam as TicketStatus)
    ? (statusParam as TicketStatus)
    : undefined
  const category = VALID_CATEGORIES.includes(categoryParam as TicketCategory)
    ? (categoryParam as TicketCategory)
    : undefined

  const where: Prisma.TicketWhereInput = {}
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { fromName: { contains: search, mode: 'insensitive' } },
      { fromEmail: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (status) where.status = status
  if (category) where.category = category

  const PAGE_SIZE = 10
  const page = Math.max(1, parseInt(req.query.page as string) || 1)

  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      select: {
        id: true,
        subject: true,
        fromEmail: true,
        fromName: true,
        status: true,
        category: true,
        createdAt: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.ticket.count({ where }),
  ])

  res.json({ tickets, total })
})

router.get('/tickets/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ticket id' })
    return
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' })
    return
  }

  res.json(ticket)
})

export default router
