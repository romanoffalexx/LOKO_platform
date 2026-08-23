import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool.js'

export const geoZonesRouter = Router()

/** GET /api/geo-zones */
geoZonesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT gz.*,
        (SELECT COUNT(*) FROM organizations o WHERE o.zone = gz.name) AS organizations_count,
        (SELECT COUNT(*) FROM tablets t WHERE t.zone = gz.name) AS tablets_count,
        (SELECT COUNT(*) FROM offers f WHERE f.zone = gz.name) AS offers_count
      FROM geo_zones gz ORDER BY gz.name
    `)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/geo-zones */
geoZonesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { city, name, sector } = req.body
    const { rows } = await pool.query(
      `INSERT INTO geo_zones (city, name, sector) VALUES ($1,$2,$3) RETURNING *`,
      [city, name, sector ?? null],
    )
    res.status(201).json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** PATCH /api/geo-zones/:id */
geoZonesRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const allowed = ['city','name','sector']
    const fields = Object.entries(req.body).filter(([k]) => allowed.includes(k))
    if (fields.length === 0) return res.status(400).json({ error: 'Нет полей' })
    const set = fields.map(([k], i) => `${k} = $${i + 1}`).join(', ')
    const vals = fields.map(([, v]) => v)
    const { rows } = await pool.query(
      `UPDATE geo_zones SET ${set} WHERE id = $${fields.length + 1} RETURNING *`,
      [...vals, req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найдено' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** DELETE /api/geo-zones/:id */
geoZonesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rowCount } = await pool.query(`DELETE FROM geo_zones WHERE id = $1`, [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Не найдено' })
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
