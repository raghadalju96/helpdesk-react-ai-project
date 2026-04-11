import { Request, Response, NextFunction } from 'express'
import { auth } from '../auth'
import { fromNodeHeaders } from 'better-auth/node'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })

  if (!session) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  res.locals.user = session.user
  res.locals.session = session.session
  next()
}
