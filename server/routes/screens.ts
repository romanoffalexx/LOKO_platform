import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool.js'

export const screensRouter = Router()

/** GET /api/screens */
screensRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { organization_id } = req.query
    let sql = `
      SELECT s.*, org.name AS organization_name
      FROM screens s LEFT JOIN organizations org ON org.id = s.organization_id
    `
    const conditions: string[] = []
    const params: any[] = []
    let idx = 1
    if (organization_id) { conditions.push(`s.organization_id = $${idx++}`); params.push(organization_id) }
    if (conditions.length) sql += ` WHERE ` + conditions.join(' AND ')
    sql += ` ORDER BY s.created_at DESC`
    const { rows } = await pool.query(sql, params)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/screens/:id */
screensRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, org.name AS organization_name
       FROM screens s LEFT JOIN organizations org ON org.id = s.organization_id
       WHERE s.id = $1`,
      [req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найден' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/screens */
screensRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, organization_id, point, content, status, starts_at, ends_at } = req.body
    const { rows } = await pool.query(
      `INSERT INTO screens (name, organization_id, point, content, status, starts_at, ends_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, organization_id ?? null, point ?? '', content ?? '', status ?? 'active', starts_at, ends_at],
    )
    res.status(201).json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** PATCH /api/screens/:id */
screensRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const allowed = ['name','organization_id','point','content','status','starts_at','ends_at']
    const fields = Object.entries(req.body).filter(([k]) => allowed.includes(k))
    if (fields.length === 0) return res.status(400).json({ error: 'Нет полей' })
    const set = fields.map(([k], i) => `${k} = $${i + 1}`).join(', ')
    const vals = fields.map(([, v]) => v)
    const { rows } = await pool.query(
      `UPDATE screens SET ${set} WHERE id = $${fields.length + 1} RETURNING *`,
      [...vals, req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найден' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** DELETE /api/screens/:id */
screensRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rowCount } = await pool.query(`DELETE FROM screens WHERE id = $1`, [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Не найден' })
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
