import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db/pool.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'

export const pointsRouter = Router()

// ── GET /api/points ───────────────────────────────────────
pointsRouter.get('/', requireAuth, async (req, res) => {
  try {
    let query = `SELECT p.*, o.name as org_name
                 FROM points p
                 JOIN organizations o ON o.id = p.organization_id`
    const params: any[] = []

    if (req.session.role === 'partner') {
      query += ' WHERE p.organization_id = $1'
      params.push(req.session.organizationId)
    } else if (req.query.organization_id) {
      query += ' WHERE p.organization_id = $1'
      params.push(req.query.organization_id)
    }

    query += ' ORDER BY p.created_at DESC'
    const result = await pool.query(query, params)
    res.json(result.rows)
  } catch (err: any) {
    console.error('[Points] List error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── POST /api/points ──────────────────────────────────────
pointsRouter.post('/', requireAdmin, async (req, res) => {
  try {
    const { organization_id, name, address, phone, contact_name, email, working_hours, has_tablet } = req.body
    if (!organization_id || !name || !address) {
      return res.status(400).json({ error: 'Обязательные поля: organization_id, name, address' })
    }

    const result = await pool.query(
      `INSERT INTO points (organization_id, name, address, phone, contact_name, email, working_hours, has_tablet)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [organization_id, name, address, phone || '', contact_name || '', email || '', working_hours || '09:00-21:00', has_tablet || false]
    )

    const point = result.rows[0]

    // Если есть планшет — создаём запись с логином и паролем
    let tabletCredentials: { login: string; password: string } | null = null
    if (has_tablet) {
      tabletCredentials = await createTabletForPoint(point.id, organization_id, name)
    }

    res.json({ ...point, tablet: tabletCredentials })
  } catch (err: any) {
    console.error('[Points] Create error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── PATCH /api/points/:id ─────────────────────────────────
pointsRouter.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const allowed = ['name', 'address', 'phone', 'contact_name', 'email', 'working_hours', 'is_active', 'has_tablet']
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
      `UPDATE points SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Точка не найдена' })
    }

    res.json(result.rows[0])
  } catch (err: any) {
    console.error('[Points] Update error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── DELETE /api/points/:id ────────────────────────────────
pointsRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM points WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (err: any) {
    console.error('[Points] Delete error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── POST /api/points/:id/tablet ───────────────────────────
pointsRouter.post('/:id/tablet', requireAdmin, async (req, res) => {
  try {
    const pointId = req.params.id
    const point = await pool.query('SELECT * FROM points WHERE id = $1', [pointId])
    if (point.rows.length === 0) {
      return res.status(404).json({ error: 'Точка не найдена' })
    }

    const p = point.rows[0]
    const { password } = req.body
    const tabletPwd = password || Math.random().toString(36).slice(-12)
    const hash = await bcrypt.hash(tabletPwd, 12)

    // Генерируем логин из названия организации и порядкового номера
    const org = await pool.query('SELECT name FROM organizations WHERE id = $1', [p.organization_id])
    const orgSlug = (org.rows[0]?.name || 'partner').toLowerCase().replace(/[^a-zа-я0-9]/gi, '').slice(0, 10)

    // Считаем сколько уже точек у этого партнёра
    const countRes = await pool.query(
      'SELECT COUNT(*) FROM points WHERE organization_id = $1',
      [p.organization_id]
    )
    const pointNum = countRes.rows[0].count
    const login = `${orgSlug}-t${pointNum}`

    // Upsert: если планшет для этой точки уже есть — обновляем пароль
    await pool.query(
      `INSERT INTO tablets (name, serial, organization_id, point_id, login, password_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'offline')
       ON CONFLICT (serial) DO UPDATE SET password_hash = $6, point_id = $4`,
      [`Tablet-${login}`, `serial-${login}`, p.organization_id, pointId, login, hash]
    )

    // Обновляем точку
    await pool.query('UPDATE points SET has_tablet = true WHERE id = $1', [pointId])

    res.json({ login, password: tabletPwd, point_id: pointId })
  } catch (err: any) {
    console.error('[Points] Create tablet error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── Helper: создание планшета при создании точки ──────────
async function createTabletForPoint(pointId: string, orgId: string, pointName: string): Promise<{ login: string; password: string }> {
  const org = await pool.query('SELECT name FROM organizations WHERE id = $1', [orgId])
  const orgSlug = (org.rows[0]?.name || 'partner').toLowerCase().replace(/[^a-zа-я0-9]/gi, '').slice(0, 10)

  const countRes = await pool.query(
    'SELECT COUNT(*) FROM points WHERE organization_id = $1',
    [orgId]
  )
  const pointNum = countRes.rows[0].count
  const login = `${orgSlug}-t${pointNum}`
  const password = Math.random().toString(36).slice(-12)
  const hash = await bcrypt.hash(password, 12)

  await pool.query(
    `INSERT INTO tablets (name, serial, organization_id, point_id, login, password_hash, password_plain, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'offline')`,
    [`Tablet-${login}`, `serial-${login}`, orgId, pointId, login, hash, password]
  )

  return { login, password }
}
