import { Request, Response, NextFunction } from 'express'

// Расширяем тип Session для хранения пользовательских данных
declare module 'express-session' {
  interface SessionData {
    userId: string
    role: string
    organizationId?: string
    pointId?: string
  }
}

/** Проверка: есть ли активная сессия */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) return next()
  res.status(401).json({ error: 'Необходима авторизация' })
}

/** Проверка роли (одна или несколько) */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Необходима авторизация' })
    }
    if (!roles.includes(req.session.role ?? '')) {
      return res.status(403).json({ error: 'Доступ запрещён' })
    }
    next()
  }
}

/** Только админ */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Необходима авторизация' })
  }
  if (req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещён: только администратор' })
  }
  next()
}
