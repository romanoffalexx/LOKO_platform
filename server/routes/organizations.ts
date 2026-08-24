import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool.js'

export const organizationsRouter = Router()

/** GET /api/organizations — список всех организаций */
organizationsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*,
        (SELECT COUNT(*) FROM offers WHERE organization_id = o.id AND status = 'active') AS active_offers,
        (SELECT COUNT(*) FROM leads  WHERE organization_id = o.id) AS total_leads,
        (SELECT COUNT(*) FROM coupons WHERE organization_id = o.id AND status = 'redeemed') AS total_redeemed
      FROM organizations o
      ORDER BY o.created_at DESC
    `)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/organizations/:id — одна организация */
organizationsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM organizations WHERE id = $1`,
      [req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найдено' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/organizations — создать */
organizationsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, address, zone, logo, logo_color, phone, email, has_tablet, participates_in_offers, category, description, working_hours } = req.body
    if (!name || !address) return res.status(400).json({ error: 'name и address обязательны' })
    const { rows } = await pool.query(
      `INSERT INTO organizations (name, address, zone, logo, logo_color, phone, email, has_tablet, participates_in_offers, category, description, working_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, address, zone ?? '', logo ?? '', logo_color ?? '#A855F7', phone ?? '', email ?? '', has_tablet ?? false, participates_in_offers ?? false, category ?? '', description ?? '', working_hours ?? ''],
    )
    res.status(201).json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** PATCH /api/organizations/:id — обновить */
organizationsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const allowed = ['name','address','zone','logo','logo_color','phone','email','has_tablet','participates_in_offers','description','working_hours','category','services','logo_url','status']
    const fields = Object.entries(req.body).filter(([k]) => allowed.includes(k))
    if (fields.length === 0) return res.status(400).json({ error: 'Нет валидных полей для обновления' })
    const set = fields.map(([k], i) => `${k} = $${i + 1}`).join(', ')
    const vals = fields.map(([, v]) => v)
    const { rows } = await pool.query(
      `UPDATE organizations SET ${set} WHERE id = $${fields.length + 1} RETURNING *`,
      [...vals, req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найдено' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** DELETE /api/organizations/:id */
organizationsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rowCount } = await pool.query(`DELETE FROM organizations WHERE id = $1`, [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Не найдено' })
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
