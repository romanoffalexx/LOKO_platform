import { Router } from 'express'
import { pool } from '../db/pool.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

export const pointOffersRouter = Router()

// ── GET /api/point-offers ─────────────────────────────────
pointOffersRouter.get('/', requireAuth, async (req, res) => {
  try {
    let query = `
      SELECT po.*, o.title as offer_title, o.organization_id as offer_org_id,
             p.name as point_name, p.organization_id as point_org_id,
             org.name as org_name
      FROM point_offers po
      JOIN points p ON p.id = po.point_id
      JOIN offers o ON o.id = po.offer_id
      JOIN organizations org ON org.id = o.organization_id
    `
    const params: any[] = []

    if (req.session.role === 'partner') {
      query += ` WHERE p.organization_id = $1 OR o.organization_id = $1`
      params.push(req.session.organizationId)
    }

    query += ' ORDER BY po.created_at DESC'
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err: any) {
    console.error('[PointOffers] List error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── POST /api/point-offers ────────────────────────────────
pointOffersRouter.post('/', requireAdmin, async (req, res) => {
  try {
    const { point_id, offer_id, max_count, is_active } = req.body
    if (!point_id || !offer_id) {
      return res.status(400).json({ error: 'Обязательные поля: point_id, offer_id' })
    }

    // Точка должна принадлежать организации, которой принадлежит акция
    const { rows: check } = await pool.query(
      `SELECT p.id FROM points p
       JOIN offers o ON o.id = $2
       WHERE p.id = $1 AND p.organization_id = o.organization_id`,
      [point_id, offer_id]
    )
    if (check.length === 0) {
      return res.status(400).json({ error: 'Точка принадлежит другой организации' })
    }

    const result = await pool.query(
      `INSERT INTO point_offers (point_id, offer_id, max_count, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (point_id, offer_id)
       DO UPDATE SET max_count = $3, is_active = $4
       RETURNING *`,
      [point_id, offer_id, max_count || null, is_active !== false]
    )
    res.json(result.rows[0])
  } catch (err: any) {
    console.error('[PointOffers] Create error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── PATCH /api/point-offers/:id ───────────────────────────
pointOffersRouter.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['max_count', 'is_active', 'issued_count']
    const updates: string[] = []
    const values: any[] = []
    let idx = 1

    for (const [key, value] of Object.entries(req.body)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = $${idx++}`)
        values.push(value)
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Нет допустимых полей' })
    }

    values.push(req.params.id)
    const result = await pool.query(
      `UPDATE point_offers SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Запись не найдена' })
    }

    res.json(result.rows[0])
  } catch (err: any) {
    console.error('[PointOffers] Update error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── DELETE /api/point-offers/:id ──────────────────────────
pointOffersRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM point_offers WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err: any) {
    console.error('[PointOffers] Delete error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})
