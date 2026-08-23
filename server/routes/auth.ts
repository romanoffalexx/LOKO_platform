import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

// ── POST /api/auth/login ──────────────────────────────────
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Введите email и пароль' })
    }

    const result = await pool.query(
      `SELECT u.*, o.name as org_name
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' })
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Неверный email или пароль' })
    }

    // Сохраняем данные в сессию
    req.session.userId = user.id
    req.session.role = user.role
    req.session.organizationId = user.organization_id || undefined

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        organization_id: user.organization_id,
        organization_name: user.org_name,
        must_change_pwd: user.must_change_pwd,
      },
    })
  } catch (err: any) {
    console.error('[Auth] Login error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── POST /api/auth/logout ─────────────────────────────────
authRouter.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('[Auth] Logout error:', err.message)
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

// ── GET /api/auth/me ──────────────────────────────────────
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, u.name, u.organization_id,
              u.must_change_pwd, u.telegram_chat_id, u.telegram_username,
              o.name as org_name
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE u.id = $1`,
      [req.session.userId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }
    const u = result.rows[0]
    res.json({
      id: u.id,
      email: u.email,
      role: u.role,
      name: u.name,
      organization_id: u.organization_id,
      organization_name: u.org_name,
      must_change_pwd: u.must_change_pwd,
      telegram_chat_id: u.telegram_chat_id,
      telegram_username: u.telegram_username,
    })
  } catch (err: any) {
    console.error('[Auth] Me error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── POST /api/auth/change-password ────────────────────────
authRouter.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Минимум 6 символов' })
    }

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.session.userId!])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    if (oldPassword) {
      const valid = await bcrypt.compare(oldPassword, result.rows[0].password_hash)
      if (!valid) return res.status(400).json({ error: 'Неверный текущий пароль' })
    }

    const hash = await bcrypt.hash(newPassword, 12)
    await pool.query(
      'UPDATE users SET password_hash = $1, must_change_pwd = false WHERE id = $2',
      [hash, req.session.userId]
    )

    res.json({ ok: true })
  } catch (err: any) {
    console.error('[Auth] Change password error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── POST /api/auth/register/:token ────────────────────────
authRouter.post('/register/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { email, password, name } = req.body

    if (!email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Email и пароль минимум 6 символов обязательны' })
    }

    // Проверяем инвайт
    const inv = await pool.query(
      `SELECT * FROM invitations
       WHERE token = $1 AND used_at IS NULL AND expires_at > now()`,
      [token]
    )
    if (inv.rows.length === 0) {
      return res.status(400).json({ error: 'Инвайт недействителен или истёк' })
    }

    const invitation = inv.rows[0]

    // Проверяем что email совпадает (если был указан в инвайте)
    if (invitation.email && invitation.email !== email) {
      return res.status(400).json({ error: 'Email не совпадает с приглашением' })
    }

    const orgId = invitation.meta?.org_id
    if (!orgId) {
      return res.status(400).json({ error: 'Инвайт не привязан к организации' })
    }

    // Проверяем что пользователь ещё не зарегистрирован
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
    }

    const hash = await bcrypt.hash(password, 12)
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role, name, organization_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [email, hash, invitation.role, name || '', orgId]
    )

    // Помечаем инвайт как использованный
    await pool.query('UPDATE invitations SET used_at = now() WHERE id = $1', [invitation.id])

    // Сразу логируем
    req.session.userId = result.rows[0].id
    req.session.role = invitation.role
    req.session.organizationId = orgId

    res.json({ ok: true, user: { id: result.rows[0].id, email, role: invitation.role } })
  } catch (err: any) {
    console.error('[Auth] Register error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})
