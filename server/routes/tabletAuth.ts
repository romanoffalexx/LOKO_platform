import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db/pool.js'

export const tabletAuthRouter = Router()

// ── POST /api/tablet/login ────────────────────────────────
tabletAuthRouter.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body
    if (!login || !password) {
      return res.status(400).json({ error: 'Введите логин и пароль' })
    }

    const result = await pool.query(
      `SELECT t.*, p.id as point_id, p.name as point_title, p.organization_id, p.is_active as point_active,
              o.status as org_status
       FROM tablets t
       JOIN points p ON p.id = t.point_id
       JOIN organizations o ON o.id = p.organization_id
       WHERE t.login = $1`,
      [login]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный логин или пароль' })
    }

    const tablet = result.rows[0]

    if (!tablet.password_hash) {
      return res.status(401).json({ error: 'Пароль не установлен для этого планшета' })
    }

    const valid = await bcrypt.compare(password, tablet.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Неверный логин или пароль' })
    }

    if (!tablet.point_active) {
      return res.status(403).json({ error: 'Точка деактивирована. Обратитесь к администратору.' })
    }

    if (tablet.org_status === 'suspended') {
      return res.status(403).json({ error: 'Организация заблокирована. Обратитесь к администратору.' })
    }

    // Обновляем last_seen
    await pool.query('UPDATE tablets SET last_seen = now() WHERE id = $1', [tablet.id])

    // Сохраняем сессию
    req.session.userId = tablet.id
    req.session.role = 'tablet'
    req.session.organizationId = tablet.organization_id
    req.session.pointId = tablet.point_id

    res.json({
      tablet_id: tablet.id,
      tablet_name: tablet.name,
      point_id: tablet.point_id,
      organization_id: tablet.organization_id,
      point_name: tablet.point_title || tablet.point,
    })
  } catch (err: any) {
    console.error('[TabletAuth] Login error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── POST /api/tablet/check-participation ──────────────────
tabletAuthRouter.post('/check-participation', async (req, res) => {
  try {
    if (!req.session?.pointId) {
      return res.status(401).json({ error: 'Необходима авторизация планшета' })
    }

    const { phone } = req.body
    if (!phone) {
      return res.status(400).json({ error: 'Укажите телефон' })
    }

    const existing = await pool.query(
      'SELECT id FROM spin_participations WHERE phone = $1 AND point_id = $2',
      [phone, req.session.pointId]
    )

    res.json({ participated: existing.rows.length > 0 })
  } catch (err: any) {
    console.error('[TabletAuth] Check participation error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// ── POST /api/tablet/spin ─────────────────────────────────
tabletAuthRouter.post('/spin', async (req, res) => {
  try {
    if (!req.session?.pointId) {
      return res.status(401).json({ error: 'Необходима авторизация планшета' })
    }

    const pointId = req.session.pointId
    const orgId = req.session.organizationId!
    const { name, phone } = req.body

    if (!name || !phone) {
      return res.status(400).json({ error: 'Введите имя и номер телефона' })
    }

    // ── Проверка 1: Один розыгрыш на точку ──
    const participated = await pool.query(
      'SELECT id FROM spin_participations WHERE phone = $1 AND point_id = $2',
      [phone, pointId]
    )
    if (participated.rows.length > 0) {
      return res.status(400).json({ error: 'Вы уже участвовали в розыгрыше на этой точке' })
    }

    // ── Проверка 2: Активные акции организации ──
    // Акции привязаны к организации, точки наследуют их автоматически
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 8)
    const currentDate = now.toISOString()

    const { rows: ownRows } = await pool.query(
      `SELECT o.*, org.name as org_name
       FROM offers o
       JOIN organizations org ON org.id = o.organization_id
       WHERE o.organization_id = $1
         AND o.status = 'active'
         AND o.starts_at <= $2::timestamptz
         AND o.ends_at >= $2::timestamptz`,
      [orgId, currentDate]
    )

    // Фильтрация по времени суток
    const inTimeWindow = (o: any) => {
      if (o.time_from && o.time_to) {
        return currentTime >= o.time_from && currentTime <= o.time_to
      }
      return true
    }

    const available: any[] = ownRows.filter(inTimeWindow).map((o: any) => ({
      ...o,
      offer_id: o.id,
      offer_org_id: o.organization_id,
    }))

    // ── Акции других организаций, разрешённые галочками «Можно показывать» ──
    const { rows: allowedRows } = await pool.query(
      `SELECT o.*, org.name as org_name
       FROM offers o
       JOIN organizations org ON org.id = o.organization_id
       WHERE $1 = ANY(o.allowed_org_ids)
         AND o.organization_id != $1
         AND o.status = 'active'
         AND o.starts_at <= $2::timestamptz
         AND o.ends_at >= $2::timestamptz`,
      [orgId, currentDate]
    )
    const allowedAvailable = allowedRows.filter(inTimeWindow).map((o: any) => ({
      ...o,
      offer_id: o.id,
      offer_org_id: o.organization_id,
    }))

    const candidates = [...available, ...allowedAvailable]
    if (candidates.length === 0) {
      return res.json({ won: false, message: 'Нет доступных акций для розыгрыша' })
    }

    // ── Розыгрыш (равномерный случайный выбор, лотерея беспроигрышная) ──
    const winner = candidates[Math.floor(Math.random() * candidates.length)]

    // ── Ищем или создаём участника ──
    let participant = await pool.query('SELECT id FROM participants WHERE phone = $1', [phone])

    if (participant.rows.length === 0) {
      participant = await pool.query(
        `INSERT INTO participants (name, phone, pdn_consent, marketing_consent, pdn_consent_at, total_participations)
         VALUES ($1, $2, true, true, now(), 1)
         RETURNING id`,
        [name, phone]
      )
    } else {
      await pool.query(
        'UPDATE participants SET total_participations = total_participations + 1 WHERE id = $1',
        [participant.rows[0].id]
      )
    }

    const participantId = participant.rows[0].id

    // ── Генерация купона ──
    // Префикс кода = аббревиатура точки (идентификация купона по точке)
    const { rows: pointRows } = await pool.query('SELECT name FROM points WHERE id = $1', [pointId])
    const pointName: string = pointRows[0]?.name ?? ''
    const pointPrefix = (pointName.replace(/[^a-zA-Zа-яА-ЯёЁ0-9]/g, '').slice(0, 4) || 'PNT').toUpperCase()
    const uniqueNum = Date.now().toString(36).toUpperCase().slice(-6)
    const couponCode = `${pointPrefix}-${uniqueNum}`

    // Срок купона = конец акции (offer.ends_at), а не +30 дней
    const expiresAt = winner.ends_at ?? new Date(Date.now() + 30 * 86400000)

    const couponResult = await pool.query(
      `INSERT INTO coupons (code, user_id, offer_id, organization_id, source_tablet_id,
                           source_point_id, source_point, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'issued', $8)
       RETURNING id`,
      [couponCode, participantId, winner.offer_id, winner.offer_org_id, req.session.userId, pointId, pointName, expiresAt]
    )

    // ── Создание лида ──
    await pool.query(
      `INSERT INTO leads (coupon_id, client_name, client_phone, offer_title,
                          organization_id, source_tablet, source_point_id, source_point)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [couponResult.rows[0].id, name, phone, winner.title, orgId, req.session.userId, pointId, pointName]
    )

    // ── Обновление счётчиков ──
    // Общий счётчик выданных купонов по акции
    await pool.query(
      `UPDATE offers SET total_issued = total_issued + 1 WHERE id = $1`,
      [winner.offer_id]
    )

    // Обновление total_wins
    await pool.query(
      'UPDATE participants SET total_wins = total_wins + 1 WHERE id = $1',
      [participantId]
    )

    // Запись в spin_participations
    await pool.query(
      'INSERT INTO spin_participations (phone, point_id) VALUES ($1, $2)',
      [phone, pointId]
    )

    res.json({
      won: true,
      offer: {
        offer_id: winner.offer_id,
        organization_id: winner.offer_org_id,
        title: winner.title,
        description: winner.description,
        emoji: winner.emoji,
        bg_gradient: winner.bg_gradient,
        org_name: winner.org_name,
        ends_at: winner.ends_at,
      },
      point_name: pointName,
      coupon_code: couponCode,
      expires_at: expiresAt,
    })
  } catch (err: any) {
    console.error('[TabletAuth] Spin error:', err.message)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})
