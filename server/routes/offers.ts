import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool.js'

export const offersRouter = Router()

/** GET /api/offers — список акций (с фильтром по статусу) */
offersRouter.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined
    let sql = `
      SELECT o.*, org.name AS organization_name
      FROM offers o
      JOIN organizations org ON org.id = o.organization_id
    `
    const params: any[] = []
    if (status) {
      sql += ` WHERE o.status = $1`
      params.push(status)
    }
    sql += ` ORDER BY o.starts_at DESC`
    const { rows } = await pool.query(sql, params)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/offers/spin — барабан: выбрать случайную акцию (равномерно).
 * Возвращает выбранную акцию.
 * ВАЖНО: маршрут зарегистрирован ДО /:id, чтобы не конфликтовать.
 */
offersRouter.post('/spin', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, organization_id
       FROM offers WHERE status = 'active'`,
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Нет активных акций' })

    // Равномерный случайный выбор
    const winner = rows[Math.floor(Math.random() * rows.length)]

    // Инкрементируем total_issued
    await pool.query(`UPDATE offers SET total_issued = total_issued + 1 WHERE id = $1`, [winner.id])

    res.json(winner)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/offers/:id — одна акция */
offersRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, org.name AS organization_name
       FROM offers o JOIN organizations org ON org.id = o.organization_id
       WHERE o.id = $1`,
      [req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найдено' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/offers — создать акцию */
offersRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      title, organization_id, description, emoji, bg_gradient,
      starts_at, ends_at, zone, allowed_org_ids,
    } = req.body
    if (!title || !organization_id) return res.status(400).json({ error: 'title и organization_id обязательны' })
    const now = new Date()
    const defaultEnd = new Date(now.getTime() + 7 * 24 * 3600 * 1000) // +7 дней
    const { rows } = await pool.query(
      `INSERT INTO offers
        (title, organization_id, description, emoji, bg_gradient, starts_at, ends_at, zone, allowed_org_ids)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title, organization_id, description ?? '', emoji ?? '🎁',
       bg_gradient ?? 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)',
       starts_at || now, ends_at || defaultEnd, zone ?? '', allowed_org_ids ?? []],
    )
    res.status(201).json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** PATCH /api/offers/:id — обновить акцию */
offersRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const allowed = ['title','organization_id','description','emoji','bg_gradient','starts_at','ends_at','zone','allowed_org_ids','status','total_issued','total_redeemed','time_from','time_to']
    const fields = Object.entries(req.body).filter(([k]) => allowed.includes(k))
    if (fields.length === 0) return res.status(400).json({ error: 'Нет валидных полей' })
    const set = fields.map(([k], i) => `${k} = $${i + 1}`).join(', ')
    const vals = fields.map(([, v]) => v)
    const { rows } = await pool.query(
      `UPDATE offers SET ${set} WHERE id = $${fields.length + 1} RETURNING *`,
      [...vals, req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найдено' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** DELETE /api/offers/:id */
offersRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rowCount } = await pool.query(`DELETE FROM offers WHERE id = $1`, [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Не найдено' })
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/offers/:id/spin (устаревший, для совместимости) */
offersRouter.post('/:id/spin', async (req: Request, res: Response) => {
  // Перенаправляем на общий спин-эндпоинт
  try {
    const { rows } = await pool.query(
      `SELECT id, title, organization_id
       FROM offers WHERE status = 'active'`,
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Нет активных акций' })

    const winner = rows[Math.floor(Math.random() * rows.length)]

    res.json(winner)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
