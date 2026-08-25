import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool.js'
import { requireAdmin } from '../middleware/auth.js'

export const zonesRouter = Router()

/** GET /api/zones — список зон справочника (с числом точек, где зона используется) */
zonesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT z.*, (SELECT COUNT(*)::int FROM points p WHERE p.zone = z.name) AS points_count
       FROM zones z ORDER BY z.name`
    )
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/zones — создать зону (дубликат не создаётся, возвращается существующая) */
zonesRouter.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const name = (req.body.name || '').trim()
    if (!name) return res.status(400).json({ error: 'Название зоны обязательно' })

    const { rows } = await pool.query(
      `INSERT INTO zones (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [name],
    )
    res.status(201).json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** PATCH /api/zones/:id — переименовать зону (имя обновляется и у точек) */
zonesRouter.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const name = (req.body.name || '').trim()
    if (!name) return res.status(400).json({ error: 'Название зоны обязательно' })

    const current = await pool.query('SELECT name FROM zones WHERE id = $1', [req.params.id])
    if (current.rows.length === 0) return res.status(404).json({ error: 'Зона не найдена' })
    const oldName = current.rows[0].name

    const { rows } = await pool.query(
      'UPDATE zones SET name = $1 WHERE id = $2 RETURNING *',
      [name, req.params.id],
    )
    // Точки хранят имя зоны строкой — обновляем следом
    if (oldName !== name) {
      await pool.query('UPDATE points SET zone = $1 WHERE zone = $2', [name, oldName])
    }
    res.json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** DELETE /api/zones/:id — удалить зону. Если используется точками — нужен ?force=1 */
zonesRouter.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const current = await pool.query('SELECT name FROM zones WHERE id = $1', [req.params.id])
    if (current.rows.length === 0) return res.status(404).json({ error: 'Зона не найдена' })
    const zoneName = current.rows[0].name

    const usage = await pool.query('SELECT COUNT(*)::int AS n FROM points WHERE zone = $1', [zoneName])
    const usedBy = usage.rows[0].n

    if (usedBy > 0 && req.query.force !== '1') {
      return res.status(400).json({ error: `Зона используется ${usedBy} точками. Подтвердите удаление (force) — у точек зона будет очищена` })
    }
    if (usedBy > 0) {
      await pool.query(`UPDATE points SET zone = '' WHERE zone = $1`, [zoneName])
    }

    await pool.query('DELETE FROM zones WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
