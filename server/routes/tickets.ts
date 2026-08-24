import { Router } from 'express'
import { pool } from '../db/pool.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { sendEmail } from '../services/email.js'
import { sendTelegramMessage } from '../services/telegram.js'

export const ticketsRouter = Router()

// ── GET /api/tickets ──────────────────────────────────────
// ── GET /api/tickets/count — необработанные заявки ─
ticketsRouter.get('/count', requireAuth, async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int FROM tickets WHERE status IN ('open', 'in_progress')`
    )
    res.json({ count: result.rows[0].count })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

ticketsRouter.get('/', requireAuth, async (req, res) => {
  try {
    let query = `
      SELECT t.*, o.name as org_name, u.email as creator_email
      FROM tickets t
      JOIN organizations o ON o.id = t.organization_id
      LEFT JOIN users u ON u.id = t.created_by
    `
    const params: any[] = []

    if (req.session.role === 'partner') {
      query += ' WHERE t.organization_id = $1'
      params.push(req.session.organizationId)
    }

    query += ' ORDER BY t.created_at DESC'
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err: any) {
    console.error('[Tickets] List error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── POST /api/tickets ─────────────────────────────────────
ticketsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const { subject, message } = req.body
    if (!subject || !message) {
      return res.status(400).json({ error: 'Укажите тему и текст обращения' })
    }

    const orgId = req.session.organizationId
    if (!orgId) {
      return res.status(400).json({ error: 'Организация не определена' })
    }

    const result = await pool.query(
      `INSERT INTO tickets (organization_id, subject, message, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [orgId, subject, message, req.session.userId]
    )

    const ticket = result.rows[0]

    // Создаём системное уведомление для админки
    await pool.query(
      `INSERT INTO notifications (channel, event, recipient, status) VALUES ('system', $1, 'admin', 'delivered')`,
      [`Новая заявка: ${subject}`],
    )

    // Уведомления админу (email + Telegram)
    const admins = await pool.query(
      `SELECT email, telegram_chat_id FROM users
       WHERE role = 'admin' AND is_active = true`
    )

    for (const admin of admins.rows) {
      if (admin.email) {
        await sendEmail(
          admin.email,
          `[ЛОКО] Новая заявка: ${subject}`,
          `<p>Организация подала заявку:</p>
           <p><strong>Тема:</strong> ${subject}</p>
           <p><strong>Текст:</strong> ${message}</p>`
        )
      }
      if (admin.telegram_chat_id) {
        await sendTelegramMessage(
          admin.telegram_chat_id,
          `📩 <b>Новая заявка</b>\nТема: ${subject}\n\n${message}`
        )
      }
    }

    res.json(ticket)
  } catch (err: any) {
    console.error('[Tickets] Create error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── PATCH /api/tickets/:id ────────────────────────────────
ticketsRouter.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body
    const allowed = ['open', 'in_progress', 'resolved', 'closed']
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `Статус: ${allowed.join(', ')}` })
    }

    const resolvedAt = ['resolved', 'closed'].includes(status) ? 'now()' : 'NULL'
    const result = await pool.query(
      `UPDATE tickets SET status = $1, resolved_at = ${resolvedAt}
       WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Заявка не найдена' })
    }

    const ticket = result.rows[0]

    // Уведомление партнёру при смене статуса
    const org = await pool.query(
      'SELECT email FROM organizations WHERE id = $1',
      [ticket.organization_id]
    )

    if (org.rows[0]?.email) {
      await sendEmail(
        org.rows[0].email,
        `[ЛОКО] Заявка «${ticket.subject}» — статус: ${status}`,
        `<p>Статус вашей заявки изменён: <strong>${status}</strong></p>
         <p>Тема: ${ticket.subject}</p>`
      )
    }

    // Системное уведомление о смене статуса
    await pool.query(
      `INSERT INTO notifications (channel, event, recipient, status) VALUES ('system', $1, 'admin', 'delivered')`,
      [`Заявка «${ticket.subject}» → ${status}`],
    )

    res.json(ticket)
  } catch (err: any) {
    console.error('[Tickets] Update error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})
