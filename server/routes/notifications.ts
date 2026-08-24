import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool.js'
import { notify } from '../services/notify.js'

export const notificationsRouter = Router()

/** GET /api/notifications/count — необработанные уведомления */
notificationsRouter.get('/count', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT COUNT(*)::int FROM notifications WHERE status = 'pending'`)
    res.json({ count: rows[0].count })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/notifications */
notificationsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/notifications — создать и отправить */
notificationsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { channel, event, recipient, subject, html, telegramText } = req.body
    if (!channel || !event || !recipient) {
      return res.status(400).json({ error: 'channel, event и recipient обязательны' })
    }

    // Записываем в БД + отправляем через канал
    await notify({
      channel,
      event,
      recipient,
      subject,
      html,
      telegramText,
    })

    // Возвращаем последнюю запись
    const { rows } = await pool.query(
      `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1`
    )
    res.status(201).json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** PATCH /api/notifications/:id */
notificationsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const allowed = ['channel','event','recipient','status']
    const fields = Object.entries(req.body).filter(([k]) => allowed.includes(k))
    if (fields.length === 0) return res.status(400).json({ error: 'Нет полей' })
    const set = fields.map(([k], i) => `${k} = $${i + 1}`).join(', ')
    const vals = fields.map(([, v]) => v)
    const { rows } = await pool.query(
      `UPDATE notifications SET ${set} WHERE id = $${fields.length + 1} RETURNING *`,
      [...vals, req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найдено' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})
