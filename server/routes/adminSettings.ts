import { Router } from 'express'
import { pool } from '../db/pool.js'
import { requireAdmin } from '../middleware/auth.js'

export const adminSettingsRouter = Router()

// ── GET /api/admin/settings ───────────────────────────────
adminSettingsRouter.get('/settings', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, telegram_chat_id, telegram_username
       FROM users WHERE id = $1`,
      [req.session.userId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Админ не найден' })
    }
    res.json(result.rows[0])
  } catch (err: any) {
    console.error('[AdminSettings] Get error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── PATCH /api/admin/settings ─────────────────────────────
adminSettingsRouter.patch('/settings', requireAdmin, async (req, res) => {
  try {
    const allowed = ['name', 'email', 'telegram_chat_id', 'telegram_username']
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

    values.push(req.session.userId)
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, name, telegram_chat_id, telegram_username`,
      values
    )

    res.json(result.rows[0])
  } catch (err: any) {
    console.error('[AdminSettings] Update error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})
