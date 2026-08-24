import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool.js'
import bcrypt from 'bcryptjs'
import { sendEmail } from '../services/email.js'

export const tabletsRouter = Router()

/** GET /api/tablets — список планшетов (фильтр: organization_id, status) */
tabletsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { organization_id, status } = req.query
    let sql = `
      SELECT t.*, org.name AS organization_name, pt.name AS point_name
      FROM tablets t
      LEFT JOIN organizations org ON org.id = t.organization_id
      LEFT JOIN points pt ON pt.id = t.point_id
    `
    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (organization_id) { conditions.push(`t.organization_id = $${idx++}`); params.push(organization_id) }
    if (status)          { conditions.push(`t.status = $${idx++}`);          params.push(status) }
    if (conditions.length) sql += ` WHERE ` + conditions.join(' AND ')
    sql += ` ORDER BY t.created_at DESC`

    const { rows } = await pool.query(sql, params)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/tablets/:id */
tabletsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*, org.name AS organization_name, pt.name AS point_name
       FROM tablets t
       LEFT JOIN organizations org ON org.id = t.organization_id
       LEFT JOIN points pt ON pt.id = t.point_id
       WHERE t.id = $1`,
      [req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найден' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /api/tablets — создать планшет */
tabletsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, serial, organization_id, point, point_id, zone } = req.body

    // Правило: 1 точка = 1 планшет. Планшет без точки недопустим
    if (!point_id) {
      return res.status(400).json({ error: 'Планшет создаётся только привязанным к точке' })
    }
    const { rows: exists } = await pool.query('SELECT id FROM tablets WHERE point_id = $1', [point_id])
    if (exists.length > 0) {
      return res.status(400).json({ error: 'На этой точке уже есть планшет (1 точка = 1 планшет)' })
    }

    // Генерируем логин и пароль для планшета
    const login = `tablet_${Date.now().toString(36)}`
    const rawPassword = generatePassword()
    const password_hash = await bcrypt.hash(rawPassword, 12)

    const { rows } = await pool.query(
      `INSERT INTO tablets (name, serial, organization_id, point, point_id, zone, login, password_hash, password_plain)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, serial, organization_id ?? null, point ?? '', point_id || null, zone ?? '', login, password_hash, rawPassword],
    )

    const tablet = rows[0]
    let emailSent = false
    let partnerEmail: string | null = null

    // Ищем email партнёра организации
    if (organization_id) {
      const partnerResult = await pool.query(
        `SELECT u.email FROM users u WHERE u.organization_id = $1 AND u.role = 'partner' AND u.is_active = true LIMIT 1`,
        [organization_id]
      )
      partnerEmail = partnerResult.rows[0]?.email || null

      // Отправляем письмо партнёру с данными для входа
      if (partnerEmail) {
        try {
          const loginUrl = process.env.APP_URL || 'http://localhost:3000'
          await sendEmail(
            partnerEmail,
            `[ЛОКО] Данные для входа планшета «${name}»`,
            `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#333">Планшет добавлен</h2>
              <p>В вашей организации создан новый планшет для розыгрышей:</p>
              <div style="background:#f9f9f9;padding:16px;border-radius:12px;margin:16px 0">
                <p><strong>Название:</strong> ${name}</p>
                <p><strong>Логин:</strong> <code>${login}</code></p>
                <p><strong>Пароль:</strong> <code>${rawPassword}</code></p>
              </div>
              <p>Используйте эти данные для входа в планшетное приложение.</p>
              <a href="${loginUrl}/login" style="display:inline-block;background:linear-gradient(135deg,#FF2D6A,#A855F7);color:#fff;padding:10px 24px;border-radius:10px;text-decoration:none;font-weight:600">Войти</a>
            </div>`
          )
          emailSent = true
        } catch (err: any) {
          console.error('[Tablets] Email error:', err.message)
        }
      }
    }

    res.status(201).json({
      ...tablet,
      login,
      password: rawPassword,
      emailSent,
      partnerEmail,
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** Генерация случайного пароля */
function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let pwd = ''
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

/** PATCH /api/tablets/:id — обновить планшет (включая смену пароля) */
tabletsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { new_password, ...rest } = req.body

    // Правило «1 точка = 1 планшет»: запрет отвязки от точки и дублей при смене точки
    if (rest.point_id !== undefined) {
      if (!rest.point_id) {
        return res.status(400).json({ error: 'Планшет должен быть привязан к точке' })
      }
      const { rows: dup } = await pool.query(
        'SELECT id FROM tablets WHERE point_id = $1 AND id != $2',
        [rest.point_id, req.params.id],
      )
      if (dup.length > 0) {
        return res.status(400).json({ error: 'На этой точке уже есть планшет (1 точка = 1 планшет)' })
      }
    }

    // Если передан новый пароль — хэшируем и сохраняем
    if (new_password) {
      const hash = await bcrypt.hash(new_password, 12)
      await pool.query(
        `UPDATE tablets SET password_hash = $1, password_plain = $2 WHERE id = $3`,
        [hash, new_password, req.params.id],
      )
    }

    const allowed = ['name','serial','organization_id','point','point_id','zone','status','last_seen','app_version']
    const fields = Object.entries(rest).filter(([k]) => allowed.includes(k))
    if (fields.length === 0 && !new_password) return res.status(400).json({ error: 'Нет полей' })

    if (fields.length > 0) {
      const set = fields.map(([k], i) => `${k} = $${i + 1}`).join(', ')
      const vals = fields.map(([, v]) => v)
      await pool.query(
        `UPDATE tablets SET ${set} WHERE id = $${fields.length + 1}`,
        [...vals, req.params.id],
      )
    }

    const { rows } = await pool.query(`SELECT * FROM tablets WHERE id = $1`, [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'Не найден' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/** POST /api/tablets/:id/reset-password — сгенерировать новый пароль */
tabletsRouter.post('/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const newPassword = generatePassword()
    const hash = await bcrypt.hash(newPassword, 12)
    const { rows } = await pool.query(
      `UPDATE tablets SET password_hash = $1, password_plain = $2 WHERE id = $3 RETURNING *`,
      [hash, newPassword, req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найден' })
    res.json({ ...rows[0], password: newPassword })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** DELETE /api/tablets/:id */
tabletsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rowCount } = await pool.query(`DELETE FROM tablets WHERE id = $1`, [req.params.id])
    if (rowCount === 0) return res.status(404).json({ error: 'Не найден' })
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
