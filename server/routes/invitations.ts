import { Router } from 'express'
import crypto from 'crypto'
import { pool } from '../db/pool.js'
import { requireAdmin } from '../middleware/auth.js'

export const invitationsRouter = Router()

// ── GET /api/invitations ──────────────────────────────────
invitationsRouter.get('/', requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, u.name as created_by_name, o.name as org_name
       FROM invitations i
       LEFT JOIN users u ON u.id = i.created_by
       LEFT JOIN organizations o ON o.id = i.meta->>'org_id'
       ORDER BY i.created_at DESC`
    )
    res.json(result.rows)
  } catch (err: any) {
    console.error('[Invitations] Error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── POST /api/invitations ─────────────────────────────────
invitationsRouter.post('/', requireAdmin, async (req, res) => {
  try {
    const { email, org_id } = req.body
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000) // 7 дней

    const result = await pool.query(
      `INSERT INTO invitations (token, role, email, meta, created_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [token, 'partner', email || null, JSON.stringify({ org_id }), req.session.userId, expiresAt]
    )

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/${token}`
    res.json({ ...result.rows[0], invite_url: inviteUrl })
  } catch (err: any) {
    console.error('[Invitations] Create error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── DELETE /api/invitations/:id ───────────────────────────
invitationsRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM invitations WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err: any) {
    console.error('[Invitations] Delete error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})
