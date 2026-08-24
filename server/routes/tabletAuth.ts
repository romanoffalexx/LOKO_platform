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
      `SELECT t.*, p.id as point_id, p.organization_id, p.is_active as point_active,
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
      point_id: tablet.point_id,
      organization_id: tablet.organization_id,
      point_name: tablet.point,
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

    // ── Проверка 2: Активные акции на точке ──
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 8)
    const currentDate = now.toISOString()

    const pointOffers = await pool.query(
      `SELECT po.*, o.title, o.description, o.weight, o.organization_id as offer_org_id,
              o.starts_at, o.ends_at, o.time_from, o.time_to, o.emoji, o.bg_gradient,
              org.category as org_category, org.name as org_name
       FROM point_offers po
       JOIN offers o ON o.id = po.offer_id
       JOIN organizations org ON org.id = o.organization_id
       WHERE po.point_id = $1
         AND po.is_active = true
         AND o.status = 'active'
         AND o.starts_at <= $2::timestamptz
         AND o.ends_at >= $2::timestamptz`,
      [pointId, currentDate]
    )

    if (pointOffers.rows.length === 0) {
      return res.json({ won: false, message: 'Нет активных акций на данной точке' })
    }

    // Фильтрация по времени суток
    let available = pointOffers.rows.filter((po: any) => {
      if (po.time_from && po.time_to) {
        return currentTime >= po.time_from && currentTime <= po.time_to
      }
      return true
    })

    // ── Проверка 3: Защита от конкурентов ──
    const myOrg = await pool.query(
      'SELECT category FROM organizations WHERE id = $1',
      [orgId]
    )
    const myCategory = myOrg.rows[0]?.category || ''

    if (myCategory) {
      available = available.filter((po: any) => po.org_category !== myCategory || po.offer_org_id === orgId)
    }

    // ── Проверка 4: Лимиты ──
    available = available.filter((po: any) => {
      return po.max_count === null || po.issued_count < po.max_count
    })

    if (available.length === 0) {
      return res.json({ won: false, message: 'Нет доступных акций для розыгрыша' })
    }

    // ── Розыгрыш (взвешенная случайная выборка) ──
    const totalWeight = available.reduce((sum: number, po: any) => sum + (po.weight || 10), 0)
    let random = Math.random() * totalWeight
    let winner = available[0]

    for (const po of available) {
      random -= (po.weight || 10)
      if (random <= 0) {
        winner = po
        break
      }
    }

    // Определяем: выиграл или нет (шанс ~70%)
    const isWinner = Math.random() < 0.7

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

    if (!isWinner) {
      // Создаём spin_participation
      await pool.query(
        'INSERT INTO spin_participations (phone, point_id) VALUES ($1, $2)',
        [phone, pointId]
      )

      return res.json({
        won: false,
        message: 'К сожалению, вы не выиграли в этот раз. Попробуйте на другой точке!',
      })
    }

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
                           source_point_id, status, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'issued', $7)
       RETURNING id`,
      [couponCode, participantId, winner.offer_id, winner.offer_org_id, req.session.userId, pointId, expiresAt]
    )

    // ── Создание лида ──
    await pool.query(
      `INSERT INTO leads (coupon_id, client_name, client_phone, offer_title,
                          organization_id, source_tablet, source_point_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [couponResult.rows[0].id, name, phone, winner.title, orgId, req.session.userId, pointId]
    )

    // ── Обновление счётчиков ──
    await pool.query(
      `UPDATE point_offers SET issued_count = issued_count + 1 WHERE id = $1`,
      [winner.id]
    )

    // Автодеактивация при достижении лимита
    await pool.query(
      `UPDATE point_offers SET is_active = false
       WHERE id = $1 AND max_count IS NOT NULL AND issued_count >= max_count`,
      [winner.id]
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
