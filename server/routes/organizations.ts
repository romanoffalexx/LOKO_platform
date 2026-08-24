import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool.js'
import bcrypt from 'bcryptjs'
import { sendEmail } from '../services/email.js'
import { notifyAdmins } from '../services/notify.js'

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
      `SELECT o.*,
        (SELECT COUNT(*) FROM offers WHERE organization_id = o.id AND status = 'active') AS active_offers,
        (SELECT COUNT(*) FROM leads  WHERE organization_id = o.id) AS total_leads,
        (SELECT COUNT(*) FROM coupons WHERE organization_id = o.id AND status = 'redeemed') AS total_redeemed
       FROM organizations o WHERE o.id = $1`,
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
    const { name, address, zone, logo, logo_color, phone, email, password, has_tablet, participates_in_offers, category, description, working_hours } = req.body
    if (!name || !address) return res.status(400).json({ error: 'name и address обязательны' })

    // Если указан email — нужен и пароль
    if (email && !password) return res.status(400).json({ error: 'Укажите пароль для аккаунта партнёра' })

    // Проверяем уникальность email
    if (email) {
      const dup = await pool.query('SELECT id FROM users WHERE email = $1', [email])
      if (dup.rows.length > 0) return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
    }

    // Создаём организацию
    const { rows } = await pool.query(
      `INSERT INTO organizations (name, address, zone, logo, logo_color, phone, email, has_tablet, participates_in_offers, category, description, working_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, address, zone ?? '', logo ?? '', logo_color ?? '#A855F7', phone ?? '', email ?? '', has_tablet ?? false, participates_in_offers ?? false, category ?? '', description ?? '', working_hours ?? ''],
    )
    const org = rows[0]

    // Создаём пользователя-партнёра, если указан email
    let emailSent = false
    if (email && password) {
      const hash = await bcrypt.hash(password, 12)
      await pool.query(
        `INSERT INTO users (email, password_hash, role, name, organization_id)
         VALUES ($1, $2, 'partner', $3, $4)`,
        [email, hash, name, org.id]
      )

      // Отправляем письмо с учётными данными
      try {
        const loginUrl = process.env.APP_URL || 'http://localhost:3000'
        await sendEmail(
          email,
          `Доступ в кабинет партнёра — ${name}`,
          `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#A855F7">${name}</h2>
            <p>Ваш аккаунт создан. Данные для входа:</p>
            <div style="background:#f9f5ff;border-radius:12px;padding:16px;margin:16px 0">
              <p style="margin:4px 0"><b>Логин:</b> ${email}</p>
              <p style="margin:4px 0"><b>Пароль:</b> ${password}</p>
            </div>
            <a href="${loginUrl}/login" style="display:inline-block;background:linear-gradient(135deg,#FF2D6A,#A855F7);color:#fff;padding:10px 24px;border-radius:10px;text-decoration:none;font-weight:600">Войти</a>
          </div>`
        )
        emailSent = true
      } catch (mailErr: any) {
        console.error('[Org] Ошибка отправки email:', mailErr.message)
      }
    }

    res.status(201).json({ ...org, emailSent, partnerEmail: email || null, partnerPassword: email && password ? password : null })

    // Уведомляем админов о новой организации (email + Telegram)
    notifyAdmins({
      event: `Новая организация: ${name}`,
      subject: `[ЛОКО] Новая организация: ${name}`,
      html: `<p>Создана новая организация:</p>
             <p><b>Название:</b> ${name}</p>
             <p><b>Адрес:</b> ${address}</p>
             ${email ? `<p><b>Email партнёра:</b> ${email}</p>` : ''}`,
      telegramText: `🏢 <b>Новая организация</b>\n${name}\n📍 ${address}${email ? `\n✉️ ${email}` : ''}${password ? `\n🔑 Пароль: <code>${password}</code>` : ''}`,
    }).catch(err => console.error('[Org] notifyAdmins error:', err.message))
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
